from unittest.mock import patch

from django.db import DatabaseError
from django.test import SimpleTestCase
from rest_framework.test import APIClient

from . import sql_queries


class DashboardViewTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_dashboard_requires_email(self):
        response = self.client.get('/api/dashboard/')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {'error': 'Email wajib diisi.'})

    @patch('api.views.sql_queries.get_dashboard')
    def test_dashboard_returns_member_payload(self, get_dashboard):
        get_dashboard.return_value = {
            'role': 'member',
            'profile': {'email': 'member@mail.com'},
            'member': {'nomor_member': 'M0001'},
            'recent_transactions': [],
        }

        response = self.client.get('/api/dashboard/?email=member@mail.com')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['role'], 'member')
        self.assertIn('profile', response.json())
        self.assertIn('member', response.json())
        self.assertIn('recent_transactions', response.json())

    @patch('api.views.sql_queries.get_dashboard')
    def test_dashboard_returns_staff_payload(self, get_dashboard):
        get_dashboard.return_value = {
            'role': 'staf',
            'profile': {'email': 'staff@mail.com'},
            'staf': {'id_staf': 'S0001'},
            'claim_summary': {
                'pending_all_staff': 1,
                'approved_by_this_staff': 2,
                'rejected_by_this_staff': 3,
            },
        }

        response = self.client.get('/api/dashboard/?email=staff@mail.com')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['role'], 'staf')
        self.assertIn('profile', response.json())
        self.assertIn('staf', response.json())
        self.assertIn('claim_summary', response.json())

    @patch('api.views.sql_queries.get_dashboard')
    def test_dashboard_unknown_email_returns_404(self, get_dashboard):
        get_dashboard.side_effect = sql_queries.DashboardUserNotFound(
            sql_queries.ERROR_USER_NOT_FOUND
        )

        response = self.client.get('/api/dashboard/?email=missing@mail.com')

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {'error': 'Pengguna tidak ditemukan.'})


class TransactionFlowViewTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('api.views.sql_queries.transfer_miles')
    def test_transfer_miles_returns_database_success_message(self, transfer_miles):
        transfer_miles.return_value = {
            'message': 'SUKSES: Transfer 200 miles dari "andi@mail.com" ke "sari@mail.com" berhasil dicatat.',
            'sender_email': 'andi@mail.com',
            'recipient_email': 'sari@mail.com',
            'jumlah': 200,
        }

        response = self.client.post(
            '/api/transfers/',
            {
                'email': 'andi@mail.com',
                'recipient_email': 'sari@mail.com',
                'amount': 200,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json()['message'],
            'SUKSES: Transfer 200 miles dari "andi@mail.com" ke "sari@mail.com" berhasil dicatat.',
        )

    @patch('api.views.sql_queries.database_error_message')
    @patch('api.views.sql_queries.transfer_miles')
    def test_transfer_miles_surfaces_database_error_message(self, transfer_miles, database_error_message):
        transfer_miles.side_effect = DatabaseError('insufficient miles')
        database_error_message.return_value = (
            'ERROR: Saldo award miles tidak mencukupi. Saldo Anda saat ini: 500 miles, jumlah transfer: 1000 miles.'
        )

        response = self.client.post(
            '/api/transfers/',
            {
                'email': 'andi@mail.com',
                'recipient_email': 'sari@mail.com',
                'amount': 1000,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                'error': (
                    'ERROR: Saldo award miles tidak mencukupi. '
                    'Saldo Anda saat ini: 500 miles, jumlah transfer: 1000 miles.'
                )
            },
        )

    @patch('api.views.sql_queries.submit_missing_miles_claim')
    def test_submit_claim_uses_backend_endpoint(self, submit_missing_miles_claim):
        submit_missing_miles_claim.return_value = {
            'message': 'SUKSES: Klaim missing miles "CLM-001" berhasil dicatat.',
            'id': 'CLM-001',
        }

        response = self.client.post(
            '/api/claims/',
            {
                'email': 'member@mail.com',
                'flightNumber': 'GA100',
                'flightDate': '2026-01-01',
                'ticketNumber': 'TICK-1',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['id'], 'CLM-001')

    @patch('api.views.sql_queries.purchase_miles_package')
    def test_purchase_miles_package_uses_backend_endpoint(self, purchase_miles_package):
        purchase_miles_package.return_value = {
            'message': 'SUKSES: Pembelian paket 1000 miles berhasil. Award miles dan total miles telah diperbarui.',
            'jumlah_award_miles': 1000,
        }

        response = self.client.post(
            '/api/miles-packages/purchases/',
            {'email': 'member@mail.com', 'packageId': 'AMP-001'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['jumlah_award_miles'], 1000)

    @patch('api.views.sql_queries.get_top_members')
    def test_top_member_report_endpoint(self, get_top_members):
        get_top_members.return_value = [
            {
                'peringkat': 1,
                'email_member': 'member@mail.com',
                'nama_lengkap': 'Member One',
                'total_miles_member': 10000,
            }
        ]

        response = self.client.get('/api/reports/top-members/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['peringkat'], 1)
