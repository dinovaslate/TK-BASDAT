from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Install trigger and stored procedure SQL required by the assignment.'

    def handle(self, *args, **options):
        sql_path = settings.BASE_DIR / 'sql' / 'trigger_stored_procedure.sql'
        sql = sql_path.read_text(encoding='utf-8')

        with connection.cursor() as cursor:
            cursor.execute(sql)

        self.stdout.write(self.style.SUCCESS('Installed trigger and stored procedure SQL.'))
