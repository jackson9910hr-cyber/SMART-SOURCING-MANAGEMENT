// ══════════════════════════════════════════════════════════════
// 다국어 지원 (한국어 / English)
// ══════════════════════════════════════════════════════════════
// 화면에 보이는 라벨/버튼/안내문만 번역합니다.
// AI에게 전달되는 프롬프트(지시문) 내용은 언어와 무관하게 항상 그대로 유지되어
// AI 기능 자체의 동작(기능)은 변경되지 않습니다.

var I18N = {
ko: {
  // 헤더
  app_title: '스마트 공정관리 앱 - 두산에너빌리티 Sourcing팀',
  brand_name: '스마트 공정관리 앱',
  hdr_credit_label: '파워서비스',
  hdr_credit_name: 'Sourcing팀',

  // 탭
  tab1_title: '협력사 미팅 협의록',
  tab2_title: '업체/품목별 부하관리',
  tab3_title: '메모/노트',

  // 공통 상태 표시
  status_unsaved_prompt: 'not saved_ 저장하세요',
  status_unsaved_modified: 'not saved_ 수정사항 발생',

  // 공통 버튼/라벨
  btn_add_row: '행추가',
  btn_del_row: '행삭제',
  btn_fullscreen: '전체화면',
  btn_share: '공유',
  btn_send_mail: '메일송부',
  btn_red_text: '빨간글씨',
  btn_complete: '작성완료',
  btn_save: '저장',
  btn_load: '불러오기',
  btn_excel: '엑셀다운로드',
  btn_cancel: '취소',
  btn_confirm: '확인',
  btn_delete: '삭제',
  btn_apply: '✔ 적용',
  btn_close: '닫기',
  btn_close_x: '✕ 닫기',

  // 페이지1
  sum1_lbl: '■ 회의결과 Summary',
  sum1_lbl_caps: '■ 회의결과 SUMMARY',
  sum1_placeholder: '회의 결과 요약을 입력하세요...',
  btn_ai_use: 'AI 활용',
  btn_personalization: 'Personalization',
  th_proj: '프로젝트',
  th_item: '품목명',
  th_vend: '업체명',
  th_cd: '고객납기',
  th_pod: 'PO납기',
  th_rd: '요구납기',
  th_avd: '가능납기',
  th_stat: '제작현황',
  th_rmk: '비고',
  fs1_title: '◈ 협력사 미팅 협의록',
  no_summary: '(요약 없음)',

  // 페이지2
  sum2_lbl: '■ 부하분석 Summary',
  sum2_lbl_caps: '■ 부하분석 SUMMARY',
  sum2_placeholder: '부하분석 요약을 입력하세요...',
  btn_proc_name: '공정명 입력',
  basedate_lbl: '📅 기준일',
  basedate_today: 'Today (오늘)',
  basedate_manual: '직접 입력',
  th2_vend: '업체명',
  th2_proj: '프로젝트',
  th2_item: '품목명',
  th2_req: '요구납기',
  th2_start: '제작착수일',
  th2_end: '제작완료일',
  th2_lt: 'L/T(개월)',
  th2_lt_title: '제작착수일~완료일 개월수',
  th2_rmk: '비고',
  th2_proc_start: ' 착수',
  th2_proc_end: ' 완료',
  th2_progress: '진도율',
  process_default_prefix: '공정',
  gantt_title: '◈ PROCESS GANTT CHART',
  gantt_fs_title: '◈ 업체/품목별 부하관리 · PROCESS GANTT CHART',
  gantt_no_data: '간트 데이터가 없습니다. 작성완료 버튼을 먼저 눌러주세요.',
  gantt_overall_production: '전체(제작)',
  gantt_th_num: '#',
  gantt_th_start: '착수일',
  gantt_th_end: '완료일',
  gantt_th_lt: 'L/T',

  // 페이지3 (메모/노트)
  btn_ai_edit: 'AI 수정',
  btn_new_memo: '새 메모',
  btn_excel_export: '엑셀 다운로드',
  btn_section_options: '섹션 옵션',
  memo_date_lbl: '📅 일시',
  memo_place_lbl: '📍 장소',
  memo_title_lbl: '📌 제목',
  memo_attendees_lbl: '👥 참석자',
  memo_content_lbl: '📝 회의 내용',
  memo_content2_lbl: '📋 추가 내용',
  memo_issues_lbl: '⚠ 이슈사항',
  memo_actions_lbl: '✅ 조치사항',
  memo_remarks_lbl: '💬 비고',
  memo_date_ph: '예: 2026-05-24 14:00',
  memo_place_ph: '예: 1층 회의실',
  memo_title_ph: '회의/메모 제목',
  memo_attendees_ph: '참석자 이름 입력 (예: 이재성, 이도길, ...)',
  memo_content_ph: '주요 회의 내용을 입력하세요...',
  memo_content2_ph: '추가 내용 입력...',
  memo_issues_ph: '이슈사항 및 문제점 입력...',
  memo_actions_ph: '조치사항 및 후속 Action Items 입력...',
  memo_remarks_ph: '기타 비고사항...',
  memo_fs_content_lbl: '📝 회의내용',
  memo_fs_content2_lbl: '📋 추가',
  memo_fs_issues_lbl: '⚠ 이슈',
  memo_fs_title_lbl: '📌 제목',
  memo_fs_date_lbl: '📅 일자',
  memo_fs_place_lbl: '📍 장소',
  memo_fs_attendees_lbl: '👥 참석자',
  memo_fs_actions_lbl: '✅ 조치사항',
  memo_fs_remarks_lbl: '💬 비고',
  memo_xls_title: '제목', memo_xls_date: '일자', memo_xls_place: '장소',
  memo_xls_attendees: '참석자', memo_xls_content: '회의내용',
  memo_xls_content2: '추가내용', memo_xls_issues: '이슈사항',
  memo_xls_actions: '조치사항', memo_xls_remarks: '비고',
  memo_xls_kind: '구분', memo_xls_val: '내용',

  // AI 채팅 팝업
  ai_chat_title_prefix: "Jackson's AI활용",
  ai_min: '최소화', ai_max: '최대화', ai_close: '닫기',
  ai_suggest_action: '📋 협력사별 Action 정리',
  ai_suggest_issue: '⚠️ 업체별 이슈 보고',
  ai_suggest_load: '📊 부하 분석',
  ai_chat_placeholder: 'AI에게 질문하세요...',
  ai_msg_preparing: '준비 중...',
  ai_msg_ready: '📊 AI 어시스턴트가 준비되었습니다. 현재 탭의 데이터에 대해 질문하세요!',
  ai_msg_analyzing: 'AI가 분석 중...',
  ai_no_reply: '(응답 없음)',
  ai_error_prefix: '⚠ 오류: ',
  err_unknown: '알 수 없는 오류',

  // P1 AI 수정 팝업
  p1_ai_review_title: '✏️ AI 수정 결과 — 협력사 미팅 협의록',
  p1_ai_reviewing: 'AI가 검토 중...',
  p1_ai_reviewing2: 'AI가 검토 중입니다...',
  btn_copy: '📋 복사',
  btn_apply_to_minutes: '✔ 협의록에 적용',

  // 모달: 저장
  m_save_title: '💾 파일 저장',
  m_save_fn_lbl: '저장 파일명',
  m_save_fn_ph: '예: 2026-05-24_삼성중공업',
  m_save_author_lbl: '작성자',
  m_save_author_ph: '작성자 이름 입력',
  btn_save_icon: '💾 저장',

  // 모달: 불러오기
  m_load_title: '📂 불러오기',
  m_load_author_search_lbl: '작성자 검색',
  m_load_author_search_ph: '작성자로 검색...',
  m_load_select_lbl: '저장된 파일 선택',
  loading: '불러오는 중...',
  btn_delete_file: '🗑 파일삭제',

  // 모달: 행 삭제
  m_del_title: '🗑 행 삭제',
  m_del_select_lbl: '삭제할 행 선택',
  row_label_prefix: '행 ',

  // 모달: 공정명 입력
  m_pn_title: '🔧 공정명 입력',
  proc_label_1: '공정 1', proc_label_2: '공정 2', proc_label_3: '공정 3', proc_label_4: '공정 4',
  proc_ph_1: '예: 절단', proc_ph_2: '예: 성형', proc_ph_3: '예: 용접', proc_ph_4: '예: 검사',

  // 모달: Personalization
  m_pers_title: '⚙ Personalization',
  m_pers_desc: '전체화면/공유 시 표시할 납기 열',

  // 모달: 메일 송부
  m_mail_title: '📧 메일 송부',
  m_mail_to_lbl: '수신자 이메일',
  btn_send_mail_icon: '📧 메일 송부',

  // 모달: 메모 섹션 옵션
  m_memo_opts_title: '⚙ 메모 섹션 설정',
  m_memo_opts_desc: '표시할 섹션 선택',
  ck_memo_content2: '추가 내용',
  ck_memo_issues: '이슈사항',
  ck_memo_actions: '조치사항',

  // 모달: AI 비밀번호
  m_ai_pw_title: '🔐 AI 기능 인증',
  m_ai_pw_desc: 'AI 기능은 권한이 있는 사용자만 사용할 수 있습니다.<br>관리자에게 비밀번호를 문의하세요.',
  m_ai_pw_lbl: '비밀번호',
  m_ai_pw_ph: '비밀번호 입력',
  err_pw_empty: '비밀번호를 입력하세요.',
  err_pw_wrong: '비밀번호가 올바르지 않습니다.',
  err_pw_server: '서버 연결 오류가 발생했습니다.',
  toast_verifying: '확인 중...',
  toast_ai_unlocked: 'AI 기능이 활성화되었습니다.',

  // 토스트 메시지 (공통)
  toast_select_text_first: '빨간글씨로 바꿀 텍스트를 먼저 선택하세요',
  toast_red_text_applied: '빨간글씨 적용 완료',
  toast_click_cell_select_text: '테이블 셀을 클릭하고 텍스트를 선택한 후 버튼을 누르세요',
  toast_display_settings_applied: '표시 설정 적용 완료',
  toast_select_row_to_delete: '삭제할 행을 선택하세요',
  toast_enter_filename: '파일명을 입력하세요',
  toast_saving: '저장 중...',
  toast_save_done_prefix: '저장 완료: ',
  toast_author_bracket_prefix: ' [작성자: ',
  toast_error_prefix: '오류: ',
  toast_no_saved_files: '저장된 파일이 없습니다.',
  toast_select_file_to_load: '불러올 파일을 선택하세요',
  toast_load_done_prefix: '불러오기 완료: ',
  toast_select_file_to_delete: '삭제할 파일을 선택하세요',
  confirm_delete_file: '" 파일을 삭제하시겠습니까?',
  toast_deleting: '삭제 중...',
  toast_delete_done_prefix: '삭제 완료: ',
  toast_delete_failed_prefix: '삭제 실패: ',
  toast_enter_email: '이메일 주소를 입력하세요',
  toast_mail_preparing: '메일 준비 중...',
  toast_mail_sent: '메일 송부 완료!',
  toast_mail_failed_prefix: '메일 실패: ',
  ph_photo_date: '날짜 입력',
  mail_subject_default: '협력사 공정관리 협의록',

  // 탭1 전용 토스트
  toast_nothing_to_sort: '정렬할 데이터가 없습니다',
  toast_sort_done: '고객납기 기준 오름차순 정렬 완료',
  toast_lib_loading: '라이브러리 로딩 중',
  toast_excel_done: '엑셀 다운로드 완료',
  toast_capturing: '캡쳐 중...',
  toast_capturing_alt: '쳪쳐 중...',
  toast_dl_share_run: '다운로드/공유 실행',
  fname_capture: '협의록_쳪쳐.jpg',
  fname_suffix1: '_협력사미팅협의록',
  sheet_name1: '협력사 미팅 협의록',

  // 탭2 전용 토스트
  toast_enter_data_first: '데이터를 먼저 입력하세요',
  toast_proc_name_saved: '공정명 저장 완료',
  toast_enter_gantt_dates: '제작착수일/제작완료일(YYYY-MM-DD)을 입력하세요',
  toast_row_progress_prefix: '행 ',
  toast_row_progress_mid: ' 진도율: ',
  toast_progress_input_error: '진도율 입력 오류: ',
  fname_gantt: '간트차트.jpg',
  mail_subject_gantt: '부하관리 간트차트',
  sheet_name2: '업체_품목별 부하관리',
  fname_suffix2: '_부하관리',

  // 탭3 전용
  confirm_memo_clear: '현재 내용을 모두 지우시겠습니까?',
  toast_select_memo_text: '메모 내용란을 클릭하고 텍스트를 선택한 후 버튼을 누르세요',
  toast_enter_memo_first: '메모 내용을 먼저 입력하세요',
  sheet_name3: '메모노트',
  fname_suffix3: '_메모노트',

  // AI 결과 관련 토스트
  toast_enter_data1_first: '협의록 데이터를 먼저 입력하세요',
  toast_ai_not_ready: 'AI가 아직 준비 중입니다.',
  toast_copy_nothing: '복사할 내용이 없습니다',
  toast_copied: '클립보드에 복사되었습니다',
  toast_copied2: '복사되었습니다',
  toast_apply_nothing: '적용할 내용이 없습니다',
  toast_apply_failed: 'AI 결과를 적용할 수 없습니다. 복사 후 수동으로 수정해주세요.',
  toast_apply_success: '협의록 테이블에 AI 수정 내용이 반영되었습니다'
},
en: {
  app_title: 'Smart Process Management App - Doosan Enerbility Sourcing Team',
  brand_name: 'Smart Process Management App',
  hdr_credit_label: 'Power Service',
  hdr_credit_name: 'Sourcing Team',

  tab1_title: 'Partner Meeting Minutes',
  tab2_title: 'Company/Item Load Mgmt',
  tab3_title: 'Memo/Notes',

  status_unsaved_prompt: 'not saved_ Please save',
  status_unsaved_modified: 'not saved_ Changes made',

  btn_add_row: 'Add Row',
  btn_del_row: 'Delete Row',
  btn_fullscreen: 'Fullscreen',
  btn_share: 'Share',
  btn_send_mail: 'Send Email',
  btn_red_text: 'Red Text',
  btn_complete: 'Complete',
  btn_save: 'Save',
  btn_load: 'Load',
  btn_excel: 'Export Excel',
  btn_cancel: 'Cancel',
  btn_confirm: 'Confirm',
  btn_delete: 'Delete',
  btn_apply: '✔ Apply',
  btn_close: 'Close',
  btn_close_x: '✕ Close',

  sum1_lbl: '■ Meeting Summary',
  sum1_lbl_caps: '■ MEETING SUMMARY',
  sum1_placeholder: 'Enter a summary of the meeting results...',
  btn_ai_use: 'Use AI',
  btn_personalization: 'Personalization',
  th_proj: 'Project',
  th_item: 'Item',
  th_vend: 'Supplier',
  th_cd: 'Customer Due',
  th_pod: 'PO Due',
  th_rd: 'Required Due',
  th_avd: 'Available Due',
  th_stat: 'Production Status',
  th_rmk: 'Remarks',
  fs1_title: '◈ Partner Meeting Minutes',
  no_summary: '(No summary)',

  sum2_lbl: '■ Load Analysis Summary',
  sum2_lbl_caps: '■ LOAD ANALYSIS SUMMARY',
  sum2_placeholder: 'Enter a summary of the load analysis...',
  btn_proc_name: 'Edit Process Names',
  basedate_lbl: '📅 Base Date',
  basedate_today: 'Today',
  basedate_manual: 'Manual Input',
  th2_vend: 'Supplier',
  th2_proj: 'Project',
  th2_item: 'Item',
  th2_req: 'Required Due',
  th2_start: 'Start Date',
  th2_end: 'Completion Date',
  th2_lt: 'L/T (months)',
  th2_lt_title: 'Months between Start Date and Completion Date',
  th2_rmk: 'Remarks',
  th2_proc_start: ' Start',
  th2_proc_end: ' End',
  th2_progress: 'Progress',
  process_default_prefix: 'Process ',
  gantt_title: '◈ PROCESS GANTT CHART',
  gantt_fs_title: '◈ Load Management by Company/Item · PROCESS GANTT CHART',
  gantt_no_data: 'No Gantt data. Please click the Complete button first.',
  gantt_overall_production: 'Overall (Production)',
  gantt_th_num: '#',
  gantt_th_start: 'Start',
  gantt_th_end: 'End',
  gantt_th_lt: 'L/T',

  btn_ai_edit: 'AI Edit',
  btn_new_memo: 'New Memo',
  btn_excel_export: 'Export Excel',
  btn_section_options: 'Section Options',
  memo_date_lbl: '📅 Date/Time',
  memo_place_lbl: '📍 Location',
  memo_title_lbl: '📌 Title',
  memo_attendees_lbl: '👥 Attendees',
  memo_content_lbl: '📝 Meeting Content',
  memo_content2_lbl: '📋 Additional Content',
  memo_issues_lbl: '⚠ Issues',
  memo_actions_lbl: '✅ Action Items',
  memo_remarks_lbl: '💬 Remarks',
  memo_date_ph: 'e.g. 2026-05-24 14:00',
  memo_place_ph: 'e.g. 1st Floor Meeting Room',
  memo_title_ph: 'Meeting/Memo Title',
  memo_attendees_ph: 'Enter attendee names (e.g. John Smith, Jane Doe, ...)',
  memo_content_ph: 'Enter the main meeting content...',
  memo_content2_ph: 'Enter additional content...',
  memo_issues_ph: 'Enter issues and problems...',
  memo_actions_ph: 'Enter action items and follow-ups...',
  memo_remarks_ph: 'Other remarks...',
  memo_fs_content_lbl: '📝 Meeting Content',
  memo_fs_content2_lbl: '📋 Additional',
  memo_fs_issues_lbl: '⚠ Issues',
  memo_fs_title_lbl: '📌 Title',
  memo_fs_date_lbl: '📅 Date',
  memo_fs_place_lbl: '📍 Location',
  memo_fs_attendees_lbl: '👥 Attendees',
  memo_fs_actions_lbl: '✅ Action Items',
  memo_fs_remarks_lbl: '💬 Remarks',
  memo_xls_title: 'Title', memo_xls_date: 'Date', memo_xls_place: 'Location',
  memo_xls_attendees: 'Attendees', memo_xls_content: 'Meeting Content',
  memo_xls_content2: 'Additional Content', memo_xls_issues: 'Issues',
  memo_xls_actions: 'Action Items', memo_xls_remarks: 'Remarks',
  memo_xls_kind: 'Field', memo_xls_val: 'Content',

  ai_chat_title_prefix: "Jackson's AI Assistant",
  ai_min: 'Minimize', ai_max: 'Maximize', ai_close: 'Close',
  ai_suggest_action: '📋 Compile Partner Action Items',
  ai_suggest_issue: '⚠️ Report Issues by Supplier',
  ai_suggest_load: '📊 Load Analysis',
  ai_chat_placeholder: 'Ask the AI...',
  ai_msg_preparing: 'Preparing...',
  ai_msg_ready: '📊 The AI assistant is ready. Ask a question about the current tab\'s data!',
  ai_msg_analyzing: 'AI is analyzing...',
  ai_no_reply: '(no response)',
  ai_error_prefix: '⚠ Error: ',
  err_unknown: 'Unknown error',

  p1_ai_review_title: '✏️ AI Edit Result — Partner Meeting Minutes',
  p1_ai_reviewing: 'AI is reviewing...',
  p1_ai_reviewing2: 'AI is reviewing...',
  btn_copy: '📋 Copy',
  btn_apply_to_minutes: '✔ Apply to Minutes',

  m_save_title: '💾 Save File',
  m_save_fn_lbl: 'File Name',
  m_save_fn_ph: 'e.g. 2026-05-24_CompanyName',
  m_save_author_lbl: 'Author',
  m_save_author_ph: 'Enter author name',
  btn_save_icon: '💾 Save',

  m_load_title: '📂 Load File',
  m_load_author_search_lbl: 'Search by Author',
  m_load_author_search_ph: 'Search by author...',
  m_load_select_lbl: 'Select a Saved File',
  loading: 'Loading...',
  btn_delete_file: '🗑 Delete File',

  m_del_title: '🗑 Delete Row',
  m_del_select_lbl: 'Select Row to Delete',
  row_label_prefix: 'Row ',

  m_pn_title: '🔧 Edit Process Names',
  proc_label_1: 'Process 1', proc_label_2: 'Process 2', proc_label_3: 'Process 3', proc_label_4: 'Process 4',
  proc_ph_1: 'e.g. Cutting', proc_ph_2: 'e.g. Forming', proc_ph_3: 'e.g. Welding', proc_ph_4: 'e.g. Inspection',

  m_pers_title: '⚙ Personalization',
  m_pers_desc: 'Due date columns to display in fullscreen/share',

  m_mail_title: '📧 Send Email',
  m_mail_to_lbl: 'Recipient Email',
  btn_send_mail_icon: '📧 Send Email',

  m_memo_opts_title: '⚙ Memo Section Settings',
  m_memo_opts_desc: 'Select Sections to Display',
  ck_memo_content2: 'Additional Content',
  ck_memo_issues: 'Issues',
  ck_memo_actions: 'Action Items',

  m_ai_pw_title: '🔐 AI Feature Authentication',
  m_ai_pw_desc: 'AI features are restricted to authorized users.<br>Please contact your administrator for the password.',
  m_ai_pw_lbl: 'Password',
  m_ai_pw_ph: 'Enter password',
  err_pw_empty: 'Please enter a password.',
  err_pw_wrong: 'Incorrect password.',
  err_pw_server: 'A server connection error occurred.',
  toast_verifying: 'Verifying...',
  toast_ai_unlocked: 'AI features have been unlocked.',

  toast_select_text_first: 'Please select the text to mark red first',
  toast_red_text_applied: 'Red text applied',
  toast_click_cell_select_text: 'Click a table cell, select text, then press the button',
  toast_display_settings_applied: 'Display settings applied',
  toast_select_row_to_delete: 'Please select a row to delete',
  toast_enter_filename: 'Please enter a file name',
  toast_saving: 'Saving...',
  toast_save_done_prefix: 'Saved: ',
  toast_author_bracket_prefix: ' [Author: ',
  toast_error_prefix: 'Error: ',
  toast_no_saved_files: 'No saved files.',
  toast_select_file_to_load: 'Please select a file to load',
  toast_load_done_prefix: 'Loaded: ',
  toast_select_file_to_delete: 'Please select a file to delete',
  confirm_delete_file: '"\nAre you sure you want to delete this file?',
  toast_deleting: 'Deleting...',
  toast_delete_done_prefix: 'Deleted: ',
  toast_delete_failed_prefix: 'Delete failed: ',
  toast_enter_email: 'Please enter an email address',
  toast_mail_preparing: 'Preparing email...',
  toast_mail_sent: 'Email sent!',
  toast_mail_failed_prefix: 'Email failed: ',
  ph_photo_date: 'Enter date',
  mail_subject_default: 'Partner Process Management Meeting Minutes',

  toast_nothing_to_sort: 'No data to sort',
  toast_sort_done: 'Sorted by Customer Due Date (ascending)',
  toast_lib_loading: 'Library is loading',
  toast_excel_done: 'Excel export complete',
  toast_capturing: 'Capturing...',
  toast_capturing_alt: 'Capturing...',
  toast_dl_share_run: 'Download/Share started',
  fname_capture: 'MeetingMinutes_Capture.jpg',
  fname_suffix1: '_PartnerMeetingMinutes',
  sheet_name1: 'Partner Meeting Minutes',

  toast_enter_data_first: 'Please enter data first',
  toast_proc_name_saved: 'Process names saved',
  toast_enter_gantt_dates: 'Please enter Start Date/Completion Date (YYYY-MM-DD)',
  toast_row_progress_prefix: 'Row ',
  toast_row_progress_mid: ' progress: ',
  toast_progress_input_error: 'Progress input error: ',
  fname_gantt: 'GanttChart.jpg',
  mail_subject_gantt: 'Load Management Gantt Chart',
  sheet_name2: 'Load Management by Company_Item',
  fname_suffix2: '_LoadManagement',

  confirm_memo_clear: 'Are you sure you want to clear all current content?',
  toast_select_memo_text: 'Click a memo field, select text, then press the button',
  toast_enter_memo_first: 'Please enter memo content first',
  sheet_name3: 'MemoNotes',
  fname_suffix3: '_MemoNotes',

  toast_enter_data1_first: 'Please enter meeting minutes data first',
  toast_ai_not_ready: 'The AI is still getting ready.',
  toast_copy_nothing: 'Nothing to copy',
  toast_copied: 'Copied to clipboard',
  toast_copied2: 'Copied',
  toast_apply_nothing: 'Nothing to apply',
  toast_apply_failed: 'Could not apply the AI result. Please copy and edit it manually.',
  toast_apply_success: 'AI edits have been applied to the meeting minutes table'
}
};

function t(key) {
  var dict = I18N[APP.lang] || I18N.ko;
  return (key in dict) ? dict[key] : (I18N.ko[key] !== undefined ? I18N.ko[key] : key);
}

function tProc(i) {
  return t('process_default_prefix') + i;
}

function applyI18n(root) {
  var scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-html]').forEach(function(el) {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  scope.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

function renderCurrentLanguage() {
  applyI18n();
  document.documentElement.lang = APP.lang;
  document.title = t('app_title');

  if (typeof updateProcHeaders === 'function') updateProcHeaders();
  if (typeof updateGanttLegend === 'function') updateGanttLegend();

  var ganttSec = document.getElementById('gantt-sec');
  if (ganttSec && ganttSec.style.display !== 'none' && typeof buildGantt === 'function' && APP.lastRows && APP.lastRows.length) {
    buildGantt(APP.lastRows);
  }

  if (typeof memoApplyOptions === 'function') memoApplyOptions();

  // 상태 배지(저장/미저장) 문구 갱신
  [1, 2, 3].forEach(function(pg) {
    var tx = document.getElementById('ss' + pg + 't');
    if (!tx) return;
    var st = pg === 1 ? APP.p1 : pg === 2 ? APP.p2 : (typeof MEMO_STATE !== 'undefined' ? MEMO_STATE : null);
    if (!st) return;
    tx.textContent = st.saved ? ('saved_ ' + st.name) : (st.name ? t('status_unsaved_modified') : t('status_unsaved_prompt'));
  });
}

function setLang(lang) {
  if (lang !== 'ko' && lang !== 'en') return;
  APP.lang = lang;
  try { localStorage.setItem('lang', lang); } catch (e) {}
  var koBtn = document.getElementById('lang-btn-ko'), enBtn = document.getElementById('lang-btn-en');
  if (koBtn) koBtn.classList.toggle('active', lang === 'ko');
  if (enBtn) enBtn.classList.toggle('active', lang === 'en');
  renderCurrentLanguage();
}
