import os
import re
import time
from datetime import date, timedelta

import pytest
from selenium import webdriver
from selenium.common.exceptions import ElementClickInterceptedException, NoSuchElementException, TimeoutException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


BASE_URL = os.getenv('AEROMILES_BASE_URL', 'http://127.0.0.1:3000')
TIMEOUT = 20


def env_flag(name, default=False):
  raw = os.getenv(name)
  if raw is None:
    return default
  return raw.strip().lower() in ('1', 'true', 'yes', 'on')


DEMO_MODE = env_flag('AEROMILES_DEMO_MODE', False)
HEADLESS = env_flag('AEROMILES_HEADLESS', not DEMO_MODE)
ACTION_DELAY_MS = int(os.getenv('AEROMILES_ACTION_DELAY_MS', '180' if DEMO_MODE else '0'))
PAGE_DELAY_MS = int(os.getenv('AEROMILES_PAGE_DELAY_MS', '380' if DEMO_MODE else '0'))
FINAL_PAUSE_MS = int(os.getenv('AEROMILES_FINAL_PAUSE_MS', '650' if DEMO_MODE else '0'))


def pause_ms(delay_ms):
  if delay_ms > 0:
    time.sleep(delay_ms / 1000)


@pytest.fixture
def driver():
  options = webdriver.ChromeOptions()
  if HEADLESS:
    options.add_argument('--headless=new')
  options.add_argument('--window-size=1440,1400')
  options.add_argument('--disable-gpu')
  options.add_argument('--no-sandbox')
  options.add_argument('--disable-dev-shm-usage')

  browser = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
  browser.set_window_size(1440, 1400)
  yield browser
  pause_ms(FINAL_PAUSE_MS)
  browser.quit()


def open_page(driver, path='/'):
  driver.get(BASE_URL)
  WebDriverWait(driver, TIMEOUT).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
  pause_ms(PAGE_DELAY_MS)
  driver.execute_script('window.localStorage.clear();')
  visit_path(driver, path)


def visit_path(driver, path):
  driver.get(f'{BASE_URL}{path}')
  WebDriverWait(driver, TIMEOUT).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
  pause_ms(PAGE_DELAY_MS)


def wait_for_testid(driver, test_id):
  return WebDriverWait(driver, TIMEOUT).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
  )


def click_testid(driver, test_id):
  element = WebDriverWait(driver, TIMEOUT).until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
  )
  driver.execute_script("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element)
  try:
    element.click()
  except ElementClickInterceptedException:
    driver.execute_script('arguments[0].click();', element)
  pause_ms(ACTION_DELAY_MS)
  return element


def input_testid(driver, test_id, value):
  element = wait_for_testid(driver, test_id)
  element.clear()
  pause_ms(ACTION_DELAY_MS)
  element.send_keys(value)
  pause_ms(ACTION_DELAY_MS)
  return element


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
  pause_ms(ACTION_DELAY_MS)
  return element


def select_testid(driver, test_id, visible_text):
  element = wait_for_testid(driver, test_id)
  selector = Select(element)
  try:
    selector.select_by_visible_text(visible_text)
  except NoSuchElementException:
    selector.select_by_value(visible_text)
  pause_ms(ACTION_DELAY_MS)


def wait_for_text(driver, text):
  return WebDriverWait(driver, TIMEOUT).until(
    EC.text_to_be_present_in_element((By.TAG_NAME, 'body'), text)
  )


def assert_text_present(driver, text):
  assert text in driver.find_element(By.TAG_NAME, 'body').text


def to_test_segment(value):
  return re.sub(r'(^-|-$)', '', re.sub(r'[^a-z0-9]+', '-', str(value).strip().lower()))


def wait_until_testid_gone(driver, test_id):
  WebDriverWait(driver, TIMEOUT).until_not(
    EC.presence_of_element_located((By.CSS_SELECTOR, f"[data-testid='{test_id}']"))
  )


def wait_until_table_contains(driver, test_id, text):
  WebDriverWait(driver, TIMEOUT).until(lambda browser: text in wait_for_testid(browser, test_id).text)


def wait_until_table_not_contains(driver, test_id, text):
  WebDriverWait(driver, TIMEOUT).until(lambda browser: text not in wait_for_testid(browser, test_id).text)


def login_member(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-member-tab')
  input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))
  wait_for_testid(driver, 'member-dashboard')
  pause_ms(PAGE_DELAY_MS)


def login_staff(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-staff-tab')
  input_testid(driver, 'login-email-input', 'raka.mahendra@oziskies.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/dashboard'))
  wait_for_testid(driver, 'admin-dashboard')
  pause_ms(PAGE_DELAY_MS)


def fill_valid_claim(driver, flight_date, origin='CGK', destination='SYD'):
  select_testid(driver, 'claim-airline-select', 'Ozi Skies')
  input_testid(driver, 'claim-flight-number-input', 'OZ723')
  set_date_testid(driver, 'claim-flight-date-input', flight_date)
  select_testid(driver, 'claim-origin-select', origin)
  select_testid(driver, 'claim-destination-select', destination)
  select_testid(driver, 'claim-cabin-class-select', 'Business')
  input_testid(driver, 'claim-ticket-number-input', '0812345678901')
  input_testid(driver, 'claim-pnr-input', 'ZXCV12')
  input_testid(driver, 'claim-notes-input', 'Automated test submission.')


def add_minimal_member(driver, email, member_number):
  click_testid(driver, 'add-member-button')
  wait_for_testid(driver, 'add-member-modal')
  input_testid(driver, 'member-first-name-input', 'Sinta')
  input_testid(driver, 'member-last-name-input', 'Wijaya')
  input_testid(driver, 'member-email-input', email)
  input_testid(driver, 'member-number-input', member_number)
  select_testid(driver, 'member-tier-select', 'Gold')
  select_testid(driver, 'member-status-select', 'Active')


def add_minimal_staff(
  driver,
  staff_id,
  email,
  airline='Ozi Skies',
  role='Alliance Support Analyst',
  status='Active',
  first_name='Nina',
  last_name='Surya',
):
  click_testid(driver, 'add-staff-button')
  wait_for_testid(driver, 'add-staff-modal')
  input_testid(driver, 'staff-id-input', staff_id)
  input_testid(driver, 'staff-first-name-input', first_name)
  input_testid(driver, 'staff-last-name-input', last_name)
  input_testid(driver, 'staff-email-input', email)
  select_testid(driver, 'staff-airline-select', airline)
  input_testid(driver, 'staff-role-input', role)
  select_testid(driver, 'staff-status-select', status)


def create_master_row(driver, section, values):
  click_testid(driver, f'master-add-{section}')
  wait_for_testid(driver, 'master-editor-modal')
  for field, value in values.items():
    input_testid(driver, f'master-field-{field}', str(value))
  click_testid(driver, 'master-save-button')
  wait_until_testid_gone(driver, 'master-editor-modal')


def edit_master_row(driver, section, key_value, updates):
  click_testid(driver, f'master-edit-{section}-{to_test_segment(key_value)}')
  wait_for_testid(driver, 'master-editor-modal')
  for field, value in updates.items():
    input_testid(driver, f'master-field-{field}', str(value))
  click_testid(driver, 'master-save-button')
  wait_until_testid_gone(driver, 'master-editor-modal')


def delete_master_row(driver, section, key_value):
  click_testid(driver, f'master-delete-{section}-{to_test_segment(key_value)}')
  click_testid(driver, 'confirm-accept')


def create_partner(driver, name, partner_type, status):
  click_testid(driver, 'partner-add-button')
  wait_for_testid(driver, 'partner-modal')
  input_testid(driver, 'partner-name-input', name)
  input_testid(driver, 'partner-type-input', partner_type)
  select_testid(driver, 'partner-status-select', status)
  click_testid(driver, 'partner-save-button')
  wait_until_testid_gone(driver, 'partner-modal')


def edit_partner(driver, name, partner_type=None, status=None):
  click_testid(driver, f'partner-edit-{to_test_segment(name)}')
  wait_for_testid(driver, 'partner-modal')
  if partner_type is not None:
    input_testid(driver, 'partner-type-input', partner_type)
  if status is not None:
    select_testid(driver, 'partner-status-select', status)
  click_testid(driver, 'partner-save-button')
  wait_until_testid_gone(driver, 'partner-modal')


def delete_partner(driver, name):
  click_testid(driver, f'partner-delete-{to_test_segment(name)}')
  click_testid(driver, 'confirm-accept')


def create_reward(driver, title, category, partner, miles_cost, status, active_from, active_to, description):
  click_testid(driver, 'reward-add-button')
  wait_for_testid(driver, 'reward-modal')
  input_testid(driver, 'reward-title-input', title)
  input_testid(driver, 'reward-category-input', category)
  select_testid(driver, 'reward-partner-select', partner)
  input_testid(driver, 'reward-miles-cost-input', str(miles_cost))
  select_testid(driver, 'reward-status-select', status)
  set_date_testid(driver, 'reward-active-from-input', active_from)
  set_date_testid(driver, 'reward-active-to-input', active_to)
  input_testid(driver, 'reward-description-input', description)
  click_testid(driver, 'reward-save-button')
  wait_until_testid_gone(driver, 'reward-modal')


def edit_reward(driver, title, miles_cost=None, status=None, description=None):
  click_testid(driver, f'reward-edit-{to_test_segment(title)}')
  wait_for_testid(driver, 'reward-modal')
  if miles_cost is not None:
    input_testid(driver, 'reward-miles-cost-input', str(miles_cost))
  if status is not None:
    select_testid(driver, 'reward-status-select', status)
  if description is not None:
    input_testid(driver, 'reward-description-input', description)
  click_testid(driver, 'reward-save-button')
  wait_until_testid_gone(driver, 'reward-modal')


def delete_reward(driver, title):
  click_testid(driver, f'reward-delete-{to_test_segment(title)}')
  click_testid(driver, 'confirm-accept')


def test_member_login_success(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-member-tab')
  input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/member/dashboard'))
  wait_for_testid(driver, 'member-dashboard')
  wait_for_testid(driver, 'member-award-miles-card')


def test_staff_login_success(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-staff-tab')
  input_testid(driver, 'login-email-input', 'raka.mahendra@oziskies.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/dashboard'))
  wait_for_testid(driver, 'admin-dashboard')
  wait_for_testid(driver, 'admin-pending-claims-card')


def test_submit_valid_missing_miles_claim(driver):
  login_member(driver)
  visit_path(driver, '/member/claim')
  wait_for_testid(driver, 'claim-form')
  fill_valid_claim(driver, (date.today() - timedelta(days=14)).isoformat())
  click_testid(driver, 'claim-submit')
  success = wait_for_testid(driver, 'claim-success')
  assert 'Pending Review' in success.text
  assert 'CLM-' in success.text


def test_purchase_miles_success(driver):
  login_member(driver)
  visit_path(driver, '/member/buy-miles')
  click_testid(driver, 'buy-package-1000')
  click_testid(driver, 'buy-confirm')
  wait_for_testid(driver, 'purchase-success')


def test_transfer_miles_success(driver):
  login_member(driver)
  visit_path(driver, '/member/transfer')
  input_testid(driver, 'transfer-recipient-input', 'AM-100002')
  input_testid(driver, 'transfer-amount-input', '500')
  click_testid(driver, 'transfer-confirm')
  wait_for_testid(driver, 'transfer-success')


def test_add_member_success(driver):
  login_staff(driver)
  visit_path(driver, '/admin/members')
  wait_for_testid(driver, 'admin-members-page')
  add_minimal_member(driver, 'sinta.wijaya@gmail.com', 'AM-999991')
  click_testid(driver, 'save-member-button')
  WebDriverWait(driver, TIMEOUT).until_not(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='add-member-modal']"))
  )
  wait_for_text(driver, 'AM-999991')


def test_edit_staff_success(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  wait_for_testid(driver, 'admin-staff-page')
  click_testid(driver, 'edit-staff-STF-1001')
  role_input = wait_for_testid(driver, 'staff-role-input')
  role_input.clear()
  role_input.send_keys('Alliance Support Lead')
  select_testid(driver, 'staff-status-select', 'Active')
  click_testid(driver, 'save-staff-button')
  wait_for_text(driver, 'Alliance Support Lead')


def test_staff_page_view_and_search_success(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  input_testid(driver, 'staff-search-input', 'Hana')
  wait_for_text(driver, 'hana.kobayashi@sakuraairways.com')
  click_testid(driver, 'view-staff-STF-1002')
  wait_for_testid(driver, 'staff-detail-drawer')
  wait_for_text(driver, 'Rewards Manager')


def test_staff_detail_modal_is_centered(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  click_testid(driver, 'view-staff-STF-1002')
  modal = wait_for_testid(driver, 'staff-detail-drawer')
  geometry = driver.execute_script(
    """
    const element = arguments[0].getBoundingClientRect();
    return {
      left: element.left,
      top: element.top,
      width: element.width,
      height: element.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
    """,
    modal,
  )
  modal_center_x = geometry['left'] + geometry['width'] / 2
  modal_center_y = geometry['top'] + geometry['height'] / 2
  viewport_center_x = geometry['viewportWidth'] / 2
  viewport_center_y = geometry['viewportHeight'] / 2
  assert abs(modal_center_x - viewport_center_x) <= 80
  assert abs(modal_center_y - viewport_center_y) <= 80


def test_transaction_detail_modal_is_centered(driver):
  login_staff(driver)
  visit_path(driver, '/admin/transactions')
  click_testid(driver, 'view-transaction-PUR-260412-001')
  modal = wait_for_testid(driver, 'transaction-detail-drawer')
  geometry = driver.execute_script(
    """
    const element = arguments[0].getBoundingClientRect();
    return {
      left: element.left,
      top: element.top,
      width: element.width,
      height: element.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
    """,
    modal,
  )
  modal_center_x = geometry['left'] + geometry['width'] / 2
  modal_center_y = geometry['top'] + geometry['height'] / 2
  viewport_center_x = geometry['viewportWidth'] / 2
  viewport_center_y = geometry['viewportHeight'] / 2
  assert abs(modal_center_x - viewport_center_x) <= 80
  assert abs(modal_center_y - viewport_center_y) <= 80


def test_add_staff_success(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  add_minimal_staff(driver, 'STF-9991', 'nina.surya@oziskies.com')
  click_testid(driver, 'save-staff-button')
  WebDriverWait(driver, TIMEOUT).until_not(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='add-staff-modal']"))
  )
  wait_for_text(driver, 'STF-9991')


def test_staff_crud_end_to_end(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  wait_for_testid(driver, 'admin-staff-page')

  add_minimal_staff(
    driver,
    'STF-9993',
    'mega.putri@bumiairlines.com',
    airline='Bumi Airlines',
    role='Alliance Service Desk',
    status='Active',
    first_name='Mega',
    last_name='Putri',
  )
  click_testid(driver, 'save-staff-button')
  WebDriverWait(driver, TIMEOUT).until_not(
    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='add-staff-modal']"))
  )

  input_testid(driver, 'staff-search-input', 'STF-9993')
  wait_for_text(driver, 'mega.putri@bumiairlines.com')

  click_testid(driver, 'view-staff-STF-9993')
  wait_for_testid(driver, 'staff-detail-drawer')
  assert_text_present(driver, 'Mega Putri')
  assert_text_present(driver, 'Alliance Service Desk')
  click_testid(driver, 'drawer-close-button')

  click_testid(driver, 'edit-staff-STF-9993')
  role_input = wait_for_testid(driver, 'staff-role-input')
  role_input.clear()
  pause_ms(ACTION_DELAY_MS)
  role_input.send_keys('Alliance Control Lead')
  pause_ms(ACTION_DELAY_MS)
  select_testid(driver, 'staff-status-select', 'Suspended')
  click_testid(driver, 'save-staff-button')
  wait_for_text(driver, 'Alliance Control Lead')
  wait_for_text(driver, 'Suspended')

  click_testid(driver, 'delete-staff-STF-9993')
  click_testid(driver, 'confirm-accept')
  WebDriverWait(driver, TIMEOUT).until(
    lambda browser: 'STF-9993' not in wait_for_testid(browser, 'staff-table').text
  )


def test_delete_staff_cancel(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  wait_for_testid(driver, 'admin-staff-page')
  input_testid(driver, 'staff-search-input', 'STF-1004')
  click_testid(driver, 'delete-staff-STF-1004')
  click_testid(driver, 'confirm-cancel')
  wait_for_text(driver, 'STF-1004')
  assert 'nadia.lee@lionsky.com' in wait_for_testid(driver, 'staff-table').text


def test_transaction_tabs_render_all_datasets(driver):
  login_staff(driver)
  visit_path(driver, '/admin/transactions')
  wait_for_testid(driver, 'admin-transactions-page')

  wait_for_text(driver, 'PUR-260412-001')
  click_testid(driver, 'transaction-tab-transfer')
  wait_for_text(driver, 'TRF-260402-001')
  click_testid(driver, 'transaction-tab-redemption')
  wait_for_text(driver, 'RED-260418-001')
  click_testid(driver, 'transaction-tab-claim')
  wait_for_text(driver, 'CLM-260401')


def test_admin_sidebar_tabs_claims_transactions_master_rewards_reports(driver):
  login_staff(driver)

  click_testid(driver, 'admin-nav-claims')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/claims'))
  wait_for_testid(driver, 'claim-review-page')
  wait_for_testid(driver, 'claims-table')
  click_testid(driver, 'open-claim-CLM-260327')
  WebDriverWait(driver, TIMEOUT).until(
    EC.presence_of_element_located(
      (By.XPATH, "//section[contains(@class,'claim-detail-panel')]//h2[normalize-space()='CLM-260327']")
    )
  )
  assert_text_present(driver, 'Maya Laras')

  click_testid(driver, 'admin-nav-transactions')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/transactions'))
  wait_for_testid(driver, 'admin-transactions-page')
  wait_for_testid(driver, 'transactions-table')
  click_testid(driver, 'view-transaction-PUR-260412-001')
  wait_for_testid(driver, 'transaction-detail-drawer')
  assert_text_present(driver, 'Settled')
  click_testid(driver, 'drawer-close-button')
  click_testid(driver, 'transaction-tab-transfer')
  wait_for_text(driver, 'TRF-260402-001')
  click_testid(driver, 'transaction-tab-redemption')
  wait_for_text(driver, 'RED-260418-001')
  click_testid(driver, 'transaction-tab-claim')
  wait_for_text(driver, 'CLM-260401')

  click_testid(driver, 'admin-nav-master-data')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/master-data'))
  wait_for_testid(driver, 'admin-master-data-page')
  create_master_row(driver, 'airlines', {'code': 'AX9', 'name': 'AeroXpress', 'status': 'Active'})
  wait_until_table_contains(driver, 'master-table-airlines', 'AX9')
  wait_until_table_contains(driver, 'master-table-airlines', 'AeroXpress')
  edit_master_row(driver, 'airlines', 'AX9', {'name': 'AeroXpress Prime'})
  wait_until_table_contains(driver, 'master-table-airlines', 'AeroXpress Prime')
  delete_master_row(driver, 'airlines', 'AX9')
  wait_until_table_not_contains(driver, 'master-table-airlines', 'AX9')

  create_master_row(driver, 'airports', {'code': 'LOP', 'city': 'Lombok', 'country': 'Indonesia'})
  wait_until_table_contains(driver, 'master-table-airports', 'LOP')
  wait_until_table_contains(driver, 'master-table-airports', 'Lombok')
  edit_master_row(driver, 'airports', 'LOP', {'city': 'Lombok Central'})
  wait_until_table_contains(driver, 'master-table-airports', 'Lombok Central')
  delete_master_row(driver, 'airports', 'LOP')
  wait_until_table_not_contains(driver, 'master-table-airports', 'LOP')

  create_master_row(driver, 'tiers', {'name': 'Emerald', 'threshold': '70000', 'perks': 'Fast lane concierge'})
  wait_until_table_contains(driver, 'master-table-tiers', 'Emerald')
  wait_until_table_contains(driver, 'master-table-tiers', '70000')
  edit_master_row(driver, 'tiers', 'Emerald', {'perks': 'Fast lane concierge plus suite support'})
  wait_until_table_contains(driver, 'master-table-tiers', 'suite support')
  delete_master_row(driver, 'tiers', 'Emerald')
  wait_until_table_not_contains(driver, 'master-table-tiers', 'Emerald')

  create_master_row(driver, 'milesPackages', {'amount': '7000', 'price': '2400000'})
  wait_until_table_contains(driver, 'master-table-milesPackages', '7,000')
  wait_until_table_contains(driver, 'master-table-milesPackages', '2.400.000')
  edit_master_row(driver, 'milesPackages', '7000', {'price': '2350000'})
  wait_until_table_contains(driver, 'master-table-milesPackages', '2.350.000')
  delete_master_row(driver, 'milesPackages', '7000')
  wait_until_table_not_contains(driver, 'master-table-milesPackages', '7,000')

  click_testid(driver, 'admin-nav-rewards-management')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/rewards-management'))
  wait_for_testid(driver, 'admin-rewards-management-page')
  create_partner(driver, 'OrbitStay Suites', 'Hospitality', 'Active')
  wait_until_table_contains(driver, 'partners-table', 'OrbitStay Suites')
  edit_partner(driver, 'OrbitStay Suites', status='Draft')
  wait_until_table_contains(driver, 'partners-table', 'Draft')

  create_reward(
    driver,
    'OrbitStay Suite Night',
    'Hotel Stay',
    'OrbitStay Suites',
    18000,
    'Active',
    '2026-07-01',
    '2026-12-31',
    'Suite night reward for alliance members.',
  )
  wait_until_table_contains(driver, 'rewards-management-table', 'OrbitStay Suite Night')
  wait_until_table_contains(driver, 'rewards-management-table', '18,000')
  edit_reward(driver, 'OrbitStay Suite Night', miles_cost=17500, status='Draft', description='Updated suite reward.')
  wait_until_table_contains(driver, 'rewards-management-table', '17,500')
  wait_until_table_contains(driver, 'rewards-management-table', 'OrbitStay Suite Night')
  delete_reward(driver, 'OrbitStay Suite Night')
  wait_until_table_not_contains(driver, 'rewards-management-table', 'OrbitStay Suite Night')

  delete_partner(driver, 'OrbitStay Suites')
  wait_until_table_not_contains(driver, 'partners-table', 'OrbitStay Suites')

  click_testid(driver, 'admin-nav-reports')
  WebDriverWait(driver, TIMEOUT).until(EC.url_contains('/admin/reports'))
  wait_for_testid(driver, 'admin-reports-page')


def test_approve_claim_success(driver):
  login_staff(driver)
  visit_path(driver, '/admin/claims')
  wait_for_testid(driver, 'claim-review-page')
  click_testid(driver, 'approve-claim-button')
  WebDriverWait(driver, TIMEOUT).until(
    EC.presence_of_element_located(
      (
        By.XPATH,
        "//h2[normalize-space()='CLM-260401']/ancestor::section[contains(@class,'panel')]//*[contains(text(),'Approved')]",
      )
    )
  )


def test_member_login_fails_with_wrong_password(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-member-tab')
  input_testid(driver, 'login-email-input', 'adi.pratama@gmail.com')
  input_testid(driver, 'login-password-input', 'wrong-password')
  click_testid(driver, 'login-submit')
  wait_for_testid(driver, 'login-error')


def test_staff_login_rejects_personal_email(driver):
  open_page(driver, '/login')
  click_testid(driver, 'login-staff-tab')
  input_testid(driver, 'login-email-input', 'someone@gmail.com')
  input_testid(driver, 'login-password-input', 'password123')
  click_testid(driver, 'login-submit')
  wait_for_text(driver, 'Staff login requires an approved company airline email')


def test_claim_rejects_old_flight_date(driver):
  login_member(driver)
  visit_path(driver, '/member/claim')
  fill_valid_claim(driver, (date.today() - timedelta(days=220)).isoformat())
  click_testid(driver, 'claim-submit')
  wait_for_text(driver, 'Flight date must be within the last 6 months')


def test_claim_rejects_same_origin_and_destination(driver):
  login_member(driver)
  visit_path(driver, '/member/claim')
  fill_valid_claim(driver, (date.today() - timedelta(days=21)).isoformat(), origin='CGK', destination='CGK')
  click_testid(driver, 'claim-submit')
  wait_for_text(driver, 'Origin and destination cannot be the same')


def test_purchase_requires_package_selection(driver):
  login_member(driver)
  visit_path(driver, '/member/buy-miles')
  click_testid(driver, 'buy-confirm')
  wait_for_text(driver, 'Please select a miles package before confirming')


def test_transfer_rejects_excessive_amount(driver):
  login_member(driver)
  visit_path(driver, '/member/transfer')
  input_testid(driver, 'transfer-recipient-input', 'AM-100002')
  input_testid(driver, 'transfer-amount-input', '999999')
  click_testid(driver, 'transfer-confirm')
  wait_for_text(driver, 'Transfer amount cannot exceed your Award Miles balance')


def test_transfer_rejects_self_transfer(driver):
  login_member(driver)
  visit_path(driver, '/member/transfer')
  input_testid(driver, 'transfer-recipient-input', 'AM-100001')
  input_testid(driver, 'transfer-amount-input', '100')
  click_testid(driver, 'transfer-confirm')
  wait_for_text(driver, 'You cannot transfer miles to yourself')


def test_reward_redeem_insufficient_miles(driver):
  login_member(driver)
  visit_path(driver, '/member/rewards')
  click_testid(driver, 'reward-redeem-rwd-004')
  wait_for_text(driver, 'Insufficient Award Miles for this redemption')


def test_add_member_invalid_email(driver):
  login_staff(driver)
  visit_path(driver, '/admin/members')
  add_minimal_member(driver, 'bad-email-format', 'AM-999992')
  click_testid(driver, 'save-member-button')
  wait_for_text(driver, 'Enter a valid email address')
  assert 'AM-999992' not in wait_for_testid(driver, 'member-table').text


def test_add_staff_rejects_personal_email(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  add_minimal_staff(driver, 'STF-9992', 'someone@gmail.com')
  click_testid(driver, 'save-staff-button')
  wait_for_text(driver, 'Company email must use one of these domains')


def test_add_staff_rejects_duplicate_staff_id(driver):
  login_staff(driver)
  visit_path(driver, '/admin/staff')
  add_minimal_staff(driver, 'STF-1001', 'duplicate.staff@oziskies.com')
  click_testid(driver, 'save-staff-button')
  wait_for_text(driver, 'Staff ID must be unique')


def test_delete_member_cancel(driver):
  login_staff(driver)
  visit_path(driver, '/admin/members')
  wait_for_testid(driver, 'member-table')
  click_testid(driver, 'delete-member-AM-100002')
  click_testid(driver, 'confirm-cancel')
  wait_for_text(driver, 'AM-100002')
