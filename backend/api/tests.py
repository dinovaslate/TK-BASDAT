from unittest.mock import patch

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
