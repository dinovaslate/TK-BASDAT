import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { useAppContext } from '../../context/AppContext';
import { validateRejectReason } from '../../utils/validation';

export default function ClaimsPage() {
  const { state, reviewClaim, notify } = useAppContext();
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const sortedClaims = useMemo(() => [...state.claims], [state.claims]);
  const selectedClaim = sortedClaims.find((claim) => claim.id === selectedClaimId) || sortedClaims[0];

  useEffect(() => {
    if (sortedClaims.length && !selectedClaimId) {
      setSelectedClaimId(sortedClaims[0].id);
    }
  }, [selectedClaimId, sortedClaims]);

  const columns = [
    { key: 'id', label: 'Claim ID' },
    { key: 'memberName', label: 'Member' },
    { key: 'airline', label: 'Airline' },
    { key: 'flightNumber', label: 'Flight' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'gold'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Review',
      render: (row) => (
        <button
          type="button"
          className="button button-secondary compact-button"
          onClick={() => setSelectedClaimId(row.id)}
          data-testid={`open-claim-${row.id}`}
        >
          Open
        </button>
      ),
    },
  ];

  const approveSelected = () => {
    reviewClaim({ claimId: selectedClaim.id, status: 'Approved', note: 'Approved in staff console.' });
    notify({
      type: 'success',
      title: 'Claim approved',
      message: `${selectedClaim.id} moved to Approved.`,
    });
  };

  const rejectSelected = () => {
    const error = validateRejectReason(rejectReason);
    setRejectError(error);
    if (error) {
      return;
    }
    reviewClaim({ claimId: selectedClaim.id, status: 'Rejected', note: rejectReason });
    notify({
      type: 'success',
      title: 'Claim rejected',
      message: `${selectedClaim.id} updated with rejection reason.`,
    });
    setRejectReason('');
    setRejectError('');
  };

  const requestInfo = () => {
    reviewClaim({ claimId: selectedClaim.id, status: 'More Info Requested', note: 'Please provide supporting e-ticket or boarding pass.' });
    notify({
      type: 'success',
      title: 'More information requested',
      message: `${selectedClaim.id} returned to member follow-up.`,
    });
  };

  return (
    <div className="two-column-grid wide-aside" data-testid="claim-review-page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Queue</div>
            <h2>Pending and processed claims</h2>
          </div>
        </div>
        <DataTable columns={columns} rows={sortedClaims} testId="claims-table" />
      </section>

      <section className="panel claim-detail-panel">
        {selectedClaim ? (
          <div className="stack gap-lg">
            <div className="panel-header">
              <div>
                <div className="eyebrow">Claim details</div>
                <h2>{selectedClaim.id}</h2>
              </div>
              <Badge tone={selectedClaim.status === 'Approved' ? 'success' : selectedClaim.status === 'Rejected' ? 'danger' : 'gold'}>
                {selectedClaim.status}
              </Badge>
            </div>

            <div className="detail-grid">
              <div>
                <span className="detail-label">Member</span>
                <strong>{selectedClaim.memberName}</strong>
              </div>
              <div>
                <span className="detail-label">Airline</span>
                <strong>{selectedClaim.airline}</strong>
              </div>
              <div>
                <span className="detail-label">Flight</span>
                <strong>{selectedClaim.flightNumber}</strong>
              </div>
              <div>
                <span className="detail-label">Route</span>
                <strong>{selectedClaim.origin} to {selectedClaim.destination}</strong>
              </div>
              <div>
                <span className="detail-label">Ticket Number</span>
                <strong>{selectedClaim.ticketNumber}</strong>
              </div>
              <div>
                <span className="detail-label">PNR</span>
                <strong>{selectedClaim.pnr}</strong>
              </div>
            </div>

            <FormField
              label="Reject reason"
              multiline
              rows={4}
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                setRejectError('');
              }}
              error={rejectError}
              data-testid="claim-reject-reason-input"
            />

            <div className="claim-action-row">
              <button type="button" className="button button-primary" onClick={approveSelected} data-testid="approve-claim-button">
                Approve
              </button>
              <button type="button" className="button button-danger" onClick={rejectSelected} data-testid="reject-claim-button">
                Reject
              </button>
              <button type="button" className="button button-secondary" onClick={requestInfo} data-testid="request-more-info-button">
                Request More Info
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
