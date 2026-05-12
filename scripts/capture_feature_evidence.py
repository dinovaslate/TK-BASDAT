import os
import shutil
import time
from pathlib import Path

from selenium import webdriver
from selenium.common.exceptions import ElementClickInterceptedException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = os.getenv('AEROMILES_BASE_URL', 'http://127.0.0.1:3001')
TIMEOUT = 20
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / 'docs' / 'feature-evidence'


def pause(seconds=0.35):
  time.sleep(seconds)


def build_driver():
  options = webdriver.ChromeOptions()
  options.add_argument('--headless=new')
  options.add_argument('--window-size=1600,1900')
  options.add_argument('--disable-gpu')
  options.add_argument('--no-sandbox')
  options.add_argument('--disable-dev-shm-usage')
  browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
  browser.set_window_size(1600, 1900)
  return browser


def wait_for_body(driver):
  WebDriverWait(driver, TIMEOUT).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))


def wait_for_testid(driver, test_id):
  return WebDriverWait(driver, TIMEOUT).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
  )


def click_testid(driver, test_id):
  element = WebDriverWait(driver, TIMEOUT).until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
  )
  driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element)
  pause(0.15)
  try:
    element.click()
  except ElementClickInterceptedException:
    driver.execute_script('arguments[0].click();', element)
  pause()
  return element


def click_xpath(driver, xpath):
  element = WebDriverWait(driver, TIMEOUT).until(EC.element_to_be_clickable((By.XPATH, xpath)))
  driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element)
  pause(0.15)
  try:
    element.click()
  except ElementClickInterceptedException:
    driver.execute_script('arguments[0].click();', element)
  pause()
  return element


def input_testid(driver, test_id, value):
  element = wait_for_testid(driver, test_id)
  driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element)
  element.clear()
  pause(0.1)
  element.send_keys(value)
  pause(0.2)
  return element


def select_testid(driver, test_id, visible_text):
  element = wait_for_testid(driver, test_id)
  driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element)
  Select(element).select_by_visible_text(visible_text)
  pause(0.2)


def set_date_testid(driver, test_id, iso_value):
  element = wait_for_testid(driver, test_id)
  driver.execute_script(
    """
    const input = arguments[0];
    const value = arguments[1];
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    descriptor.set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    """,
    element,
    iso_value,
  )
  pause(0.2)


def visit(driver, path):
  driver.get(f'{BASE_URL}{path}')
  wait_for_body(driver)
  pause(0.4)


def reset_app(driver, path='/'):
  driver.get(BASE_URL)
  wait_for_body(driver)
  driver.execute_script('window.localStorage.clear();')
  pause(0.2)
  visit(driver, path)


def login_member(driver):
  reset_app(driver, '/login?role=member')
  click_testid(driver, 'login-member-tab')
  input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))
  wait_for_testid(driver, 'member-dashboard')
  pause(0.5)


def login_staff(driver):
  reset_app(driver, '/login?role=staff')
  click_testid(driver, 'login-staff-tab')
  input_testid(driver, 'login-email-input', 'raka.mahendra@oziskies.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/dashboard'))
  wait_for_testid(driver, 'admin-dashboard')
  pause(0.5)


def prepare_output_dir():
  if OUTPUT_DIR.exists():
    shutil.rmtree(OUTPUT_DIR)
  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def capture(driver, name, records, feature, route, caption):
  path = OUTPUT_DIR / name
  pause(0.35)
  driver.save_screenshot(str(path))
  records.append({
    'file': name,
    'feature': feature,
    'route': route,
    'caption': caption,
  })


def write_manifest(records):
  lines = [
    '# AeroMiles Feature Evidence',
    '',
    '| No | Feature | File | Route | Caption |',
    '| --- | --- | --- | --- | --- |',
  ]
  for index, record in enumerate(records, start=1):
    lines.append(
      f"| {index} | {record['feature']} | `{record['file']}` | `{record['route']}` | {record['caption']} |"
    )
  (OUTPUT_DIR / 'README.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
  prepare_output_dir()
  records = []
  driver = build_driver()

  try:
    login_member(driver)
    capture(
      driver,
      '01-navbar-member-shell.png',
      records,
      '1. Navbar',
      '/member/dashboard',
      'Member application shell showing the left navigation sidebar and global topbar.'
    )

    reset_app(driver, '/login?role=member')
    capture(
      driver,
      '02-login-member.png',
      records,
      '2. Login & Logout',
      '/login?role=member',
      'Member login tab on the shared login route.'
    )

    click_testid(driver, 'login-member-tab')
    input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
    input_testid(driver, 'login-password-input', 'password123')
    click_testid(driver, 'login-submit')
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))
    capture(
      driver,
      '03-login-success-dashboard.png',
      records,
      '2. Login & Logout',
      '/member/dashboard',
      'Successful member login landing on the dashboard with the logout control visible.'
    )
    click_testid(driver, 'topbar-logout-button')
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/login'))
    capture(
      driver,
      '04-logout-return-login.png',
      records,
      '2. Login & Logout',
      '/login',
      'Login route after clicking Logout from an authenticated session.'
    )

    reset_app(driver, '/register?role=member')
    capture(
      driver,
      '05-register-member.png',
      records,
      '3. Registration',
      '/register?role=member',
      'Member registration form with personal account fields.'
    )
    click_testid(driver, 'register-staff-tab')
    capture(
      driver,
      '06-register-staff.png',
      records,
      '3. Registration',
      '/register?role=staff',
      'Staff registration tab with company account fields.'
    )

    reset_app(driver, '/login?role=staff')
    capture(
      driver,
      '31-login-staff.png',
      records,
      '2. Login & Logout',
      '/login?role=staff',
      'Staff login tab on the shared login route.'
    )

    login_member(driver)
    capture(
      driver,
      '07-member-dashboard.png',
      records,
      '4. Dashboard',
      '/member/dashboard',
      'Member dashboard showing balances, quick actions, and recent account activity.'
    )
    capture(
      driver,
      '08-tier-info-dashboard.png',
      records,
      '13. Tier Info & Benefits',
      '/member/dashboard',
      'Member dashboard with the tier progress panel and current tier information.'
    )
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    pause(0.4)
    capture(
      driver,
      '09-member-transaction-history.png',
      records,
      '14. Reports & Miles Transaction History',
      '/member/dashboard',
      'Member dashboard transaction ledger section showing miles history entries.'
    )

    visit(driver, '/member/profile')
    wait_for_testid(driver, 'member-profile-page')
    capture(
      driver,
      '10-member-profile-settings.png',
      records,
      '5. Profile Settings',
      '/member/profile',
      'Member profile settings page for personal details and travel preferences.'
    )

    visit(driver, '/member/identity')
    wait_for_testid(driver, 'member-identity-page')
    capture(
      driver,
      '11-member-identity-list.png',
      records,
      '7. CRUD Member Identity',
      '/member/identity',
      'Identity management page listing stored member travel documents.'
    )
    click_testid(driver, 'add-identity-button')
    capture(
      driver,
      '12-member-identity-add-modal.png',
      records,
      '7. CRUD Member Identity',
      '/member/identity',
      'Identity creation modal opened from the member identity route.'
    )
    click_testid(driver, 'modal-close-button')

    visit(driver, '/member/claim')
    wait_for_testid(driver, 'claim-form')
    capture(
      driver,
      '13-member-claim-management.png',
      records,
      '8. CRUD Member Missing Miles Claim',
      '/member/claim',
      'Member missing miles claim page with submission form and claim table.'
    )
    click_testid(driver, 'view-claim-CLM-260401')
    capture(
      driver,
      '14-member-claim-detail.png',
      records,
      '8. CRUD Member Missing Miles Claim',
      '/member/claim',
      'Claim detail drawer opened from the member claim management route.'
    )
    click_testid(driver, 'drawer-close-button')
    click_testid(driver, 'edit-claim-CLM-260401')
    capture(
      driver,
      '15-member-claim-edit-form.png',
      records,
      '8. CRUD Member Missing Miles Claim',
      '/member/claim',
      'Claim form prefilled in edit mode for an existing member missing miles submission.'
    )
    click_testid(driver, 'claim-cancel-edit')

    visit(driver, '/member/transfer')
    wait_for_testid(driver, 'transfer-recipient-input')
    input_testid(driver, 'transfer-recipient-input', 'AM-100002')
    input_testid(driver, 'transfer-amount-input', '500')
    click_testid(driver, 'transfer-confirm')
    wait_for_testid(driver, 'transfer-success')
    capture(
      driver,
      '16-member-transfer-success.png',
      records,
      '10. Transfer Miles',
      '/member/transfer',
      'Transfer miles page after a successful member-to-member transfer.'
    )

    reset_app(driver, '/login?role=member')
    click_testid(driver, 'login-member-tab')
    input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
    input_testid(driver, 'login-password-input', 'password123')
    click_testid(driver, 'login-submit')
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))

    visit(driver, '/member/rewards')
    capture(
      driver,
      '17-member-reward-catalog.png',
      records,
      '11. Redeem Reward',
      '/member/rewards',
      'Reward catalog page listing redeemable member rewards.'
    )
    click_testid(driver, 'reward-redeem-rwd-001')
    wait_for_testid(driver, 'toast-success')
    capture(
      driver,
      '18-member-redeem-success.png',
      records,
      '11. Redeem Reward',
      '/member/rewards',
      'Reward route after a successful redemption, with the success toast visible.'
    )

    reset_app(driver, '/login?role=member')
    click_testid(driver, 'login-member-tab')
    input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
    input_testid(driver, 'login-password-input', 'password123')
    click_testid(driver, 'login-submit')
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))

    visit(driver, '/member/buy-miles')
    click_testid(driver, 'buy-package-1000')
    click_testid(driver, 'buy-confirm')
    wait_for_testid(driver, 'purchase-success')
    capture(
      driver,
      '19-member-buy-miles-success.png',
      records,
      '12. Buy Miles Package',
      '/member/buy-miles',
      'Buy miles route after selecting a package and completing the purchase.'
    )

    login_staff(driver)
    capture(
      driver,
      '32-admin-dashboard.png',
      records,
      '4. Dashboard',
      '/admin/dashboard',
      'Staff dashboard showing alliance operations metrics, queues, and airline performance.'
    )
    visit(driver, '/admin/profile')
    wait_for_testid(driver, 'admin-profile-page')
    capture(
      driver,
      '20-admin-profile-settings.png',
      records,
      '5. Profile Settings',
      '/admin/profile',
      'Staff profile settings page for operational contact details and alert preferences.'
    )

    visit(driver, '/admin/members')
    wait_for_testid(driver, 'admin-members-page')
    capture(
      driver,
      '21-admin-member-management.png',
      records,
      '6. CRUD Member Management',
      '/admin/members',
      'Staff member management page showing the searchable member roster.'
    )
    click_testid(driver, 'add-member-button')
    capture(
      driver,
      '22-admin-member-add-modal.png',
      records,
      '6. CRUD Member Management',
      '/admin/members',
      'Member creation modal opened from the admin member management route.'
    )
    click_testid(driver, 'modal-close-button')

    visit(driver, '/admin/claims')
    wait_for_testid(driver, 'claim-review-page')
    capture(
      driver,
      '23-staff-claim-review.png',
      records,
      '9. Staff Missing Miles Claim Management',
      '/admin/claims',
      'Staff claim review page with queue table and active claim review panel.'
    )

    visit(driver, '/admin/transactions')
    wait_for_testid(driver, 'admin-transactions-page')
    capture(
      driver,
      '24-admin-transactions.png',
      records,
      '14. Reports & Miles Transaction History',
      '/admin/transactions',
      'Staff transaction history route showing the operational ledger tabs.'
    )
    click_testid(driver, 'view-transaction-PUR-260412-001')
    capture(
      driver,
      '25-admin-transaction-detail.png',
      records,
      '14. Reports & Miles Transaction History',
      '/admin/transactions',
      'Transaction detail modal opened from the staff transaction history route.'
    )
    click_testid(driver, 'drawer-close-button')

    visit(driver, '/admin/reports')
    wait_for_testid(driver, 'admin-reports-page')
    capture(
      driver,
      '26-admin-reports.png',
      records,
      '14. Reports & Miles Transaction History',
      '/admin/reports',
      'Staff reports page with growth, tier, claims, and revenue reporting cards.'
    )

    visit(driver, '/admin/rewards-management')
    wait_for_testid(driver, 'admin-rewards-management-page')
    capture(
      driver,
      '27-admin-partner-management.png',
      records,
      '16. CRUD Partner Management',
      '/admin/rewards-management',
      'Partner management section on the rewards management route.'
    )
    click_testid(driver, 'partner-add-button')
    capture(
      driver,
      '28-admin-partner-add-modal.png',
      records,
      '16. CRUD Partner Management',
      '/admin/rewards-management',
      'Partner creation modal opened from the staff rewards management route.'
    )
    click_testid(driver, 'modal-close-button')

    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", wait_for_testid(driver, 'rewards-management-table'))
    pause(0.4)
    capture(
      driver,
      '29-admin-reward-management.png',
      records,
      '15. CRUD Reward & Provider Management',
      '/admin/rewards-management',
      'Reward management section on the staff rewards management route.'
    )
    click_testid(driver, 'reward-add-button')
    capture(
      driver,
      '30-admin-reward-add-modal.png',
      records,
      '15. CRUD Reward & Provider Management',
      '/admin/rewards-management',
      'Reward creation modal opened from the staff rewards management route.'
    )
    click_testid(driver, 'modal-close-button')

    write_manifest(records)
    print(f'Created {len(records)} screenshots in {OUTPUT_DIR}')
  finally:
    driver.quit()


if __name__ == '__main__':
  main()
