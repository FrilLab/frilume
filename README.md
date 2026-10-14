# Frilume

Frilume은 기존 Tistory 스킨을 바탕으로 하는 FrilLab 블로그 스킨입니다. 이 저장소의 작업은 새 스킨을 만드는 것이 아니라 Tistory 템플릿을 보존하면서 CSS 충돌, 시스템 테마, 반응형 배치, 코드 복사 동작을 안정화하는 것입니다.

## 기능

- Tistory 홈·카테고리·검색 결과·게시글 상세·공지·태그·방명록·사이드바·페이지네이션 템플릿 보존
- OS의 `prefers-color-scheme` 설정에 따르는 라이트·다크 색상
- 본문/aside 2열 배치, 좁은 화면의 모바일 aside 드로어
- Enter와 검색 버튼에서 기존 Tistory 검색 콜백을 실행하는 검색창
- 코드 블록 가로 스크롤, 언어 공통 여백, 복사 상태 표시 및 Clipboard API 대체 경로
- 관련 글 썸네일과 썸네일이 없을 때의 CSS 배경
- Tistory 댓글·작성자 카드의 테마 토큰 기반 스타일
- 키보드 포커스와 `prefers-reduced-motion` 처리

## 폴더 구조

```text
.
├── skin.html                 # Tistory HTML 템플릿
├── skin.css                  # Tistory CSS 편집기용 전체 스타일
├── package.json              # 로컬 검증 명령과 개발 의존성
├── package-lock.json
├── playwright.config.mjs     # Chromium 모의 브라우저 테스트 설정
└── tests/
    ├── fixture.html          # Tistory 화면/동적 컴포넌트 모의 DOM
    ├── preview.mjs           # 실제 skin.html 코드 복사 스크립트를 주입하는 로컬 서버
    ├── stabilization.spec.mjs
    └── tistory-contract.json # 원본 치환자/전용 태그 목록 검증 기준
```

## Tistory 설치 및 배포

1. 기존 스킨을 백업하고 블로그 관리 화면에서 **꾸미기 → 스킨 편집**을 엽니다.
2. [skin.html](./skin.html) 전체 내용을 HTML 편집 화면에 붙여 넣습니다.
3. [skin.css](./skin.css) 전체 내용을 CSS 편집 화면에 붙여 넣습니다. 파일 조각만 적용하지 않습니다.
4. 저장 후 홈, 카테고리, 검색, 게시글, 댓글 화면을 확인합니다. 검색·로그인·댓글은 실제 블로그에서 최종 확인해야 합니다.

HTML은 `./style.css`를 참조하고 저장소의 CSS 파일은 `skin.css`라는 이름입니다. Tistory HTML/CSS 편집 화면에서는 HTML과 CSS를 각 편집기에 붙여 넣으면 됩니다. 별도 ZIP 스킨으로 패키징할 때는 내부 참조를 유지하기 위해 `skin.css`의 배포 복사본 이름을 `style.css`로 맞춥니다. 저장소 파일명을 바꾸거나 HTML의 CSS URL을 임의로 바꾸지 마세요.

Tistory에서 직접 확인할 때는 다음을 점검합니다.

- 검색 아이콘만 눌렀을 때 제출되지 않고, 검색어를 입력한 뒤 Enter/검색 버튼으로 결과 페이지가 열리는지
- 댓글 작성·답글·로그인, 프로필 메뉴, 공지·태그·관련 글·페이지 이동이 동작하는지
- 사용자 로고와 제목이 유지되고 게시글의 Tistory 수정 레이어가 보이는지
- Tistory가 생성하는 댓글 DOM과 Namecard가 라이트·다크 시스템 설정에서 읽히는지

## 로컬 개발 및 검증

필요 환경: Node.js와 npm. 브라우저 검증은 Playwright Chromium을 사용합니다.

```sh
npm ci
npx playwright install chromium
npm run test:visual
```

테스트 실행 때 로컬 mock 서버가 자동으로 시작됩니다. 수동 미리보기는 다음 명령으로 열 수 있습니다.

```sh
npm run preview
# http://127.0.0.1:4173/tests/fixture.html
```

fixture는 홈·카테고리·검색·게시글과 댓글/Namecard/관련 글 DOM을 재현합니다. 코드 복사 검증에는 `skin.html`의 인라인 스크립트를 직접 주입합니다. Playwright는 390px, 768px, 1024px, 1440px 및 라이트·다크 모드를 확인하며, 검색 제출, 코드 복사 성공/실패, 키보드 포커스, 모바일 aside, 페이지네이션, 대비, 가로 넘침, reduced-motion과 CSS 파싱을 검사합니다. Fixture 서버가 투명 대체 PNG로 응답하는 `images/ico_package*.png`는 저장소에 없는 Tistory 스프라이트입니다. 실제 아이콘 제공 여부를 시험하는 용도는 아닙니다.

## 테마 구조

`:root`의 기본 값은 라이트 테마이며, `@media (prefers-color-scheme: dark)`에서 같은 변수를 다크 팔레트로 덮습니다. `--fril-text`, `--fril-heading`, `--fril-paper`, `--fril-paper-2`, `--fril-line`을 컴포넌트가 공유합니다.

- Yellow: `#FFCC49`
- Light Blue: `#2764E8`
- Dark: `#0B1423` 기반 네이비
- Light: 밝은 중립 배경과 높은 본문 대비

자동/라이트/다크 수동 선택 UI와 그 상태를 위한 `:has(#fril-mode-...)` CSS는 제거했습니다. 본문 일반 제목·문단·목록은 기본 테마 토큰을 사용하며, 다크 모드에서 흔한 인라인 검정 글자와 흰 블록 배경만 범위를 제한해 보정합니다. 링크, 코드 강조, Open Graph 카드, 표, 인용문, 이미지/동영상 및 클래스/ID가 있는 사용자 정의 컴포넌트에는 일반 텍스트 색상 일괄 규칙을 적용하지 않습니다.

## Tistory 치환자 보존 기준

원본 `skin.html` 기준 조사 결과입니다. Playwright 정적 검사는 치환자와 전용 태그의 원본 순서 및 빈도가 작업 파일과 같은지 비교합니다.

- `[##_..._##]` 치환자: 181회, 고유 토큰 103개
- `<s_...>` 태그: 시작 태그 115회, 고유 이름 78개 (열기/닫기 태그명 및 빈도 검증)

전용 태그 이름 전체:

`s_article_protected`, `s_article_related`, `s_article_related_rep`, `s_article_related_rep_thumbnail`, `s_article_rep`, `s_article_rep_thumbnail`, `s_cover`, `s_cover_group`, `s_cover_item`, `s_cover_item_article_info`, `s_cover_item_thumbnail`, `s_cover_rep`, `s_cover_url`, `s_guest`, `s_if_var_facebook-link`, `s_if_var_facebook-timeline`, `s_if_var_footer-text-1`, `s_if_var_footer-text-2`, `s_if_var_instagram-link`, `s_if_var_layout-aside`, `s_if_var_list-type`, `s_if_var_logo`, `s_if_var_order-link-1-title`, `s_if_var_order-link-2-title`, `s_if_var_order-link-3-title`, `s_if_var_order-link-4-title`, `s_if_var_point-color`, `s_if_var_promotion-1-btn-color`, `s_if_var_promotion-1-btn-hover-color`, `s_if_var_promotion-1-color`, `s_if_var_promotion-1-image`, `s_if_var_promotion-1-text`, `s_if_var_promotion-1-url`, `s_if_var_promotion-2-btn-color`, `s_if_var_promotion-2-btn-hover-color`, `s_if_var_promotion-2-color`, `s_if_var_promotion-2-image`, `s_if_var_promotion-2-text`, `s_if_var_promotion-2-url`, `s_if_var_promotion-3-btn-color`, `s_if_var_promotion-3-btn-hover-color`, `s_if_var_promotion-3-color`, `s_if_var_promotion-3-image`, `s_if_var_promotion-3-text`, `s_if_var_promotion-3-url`, `s_if_var_twitter-link`, `s_if_var_twitter-timeline`, `s_if_var_view-more`, `s_if_var_youtube-link`, `s_index_article_rep`, `s_list`, `s_list_empty`, `s_not_var_logo`, `s_not_var_promotion-1-url`, `s_not_var_promotion-2-url`, `s_not_var_promotion-3-url`, `s_not_var_promotion-mobile-view`, `s_notice_rep`, `s_notice_rep_thumbnail`, `s_page_rep`, `s_paging`, `s_paging_rep`, `s_permalink_article_rep`, `s_random_tags`, `s_rct_notice`, `s_rct_notice_rep`, `s_rctps_popular_rep`, `s_rctps_rep`, `s_rctps_rep_thumbnail`, `s_rctrp_rep`, `s_rp`, `s_search`, `s_sidebar`, `s_sidebar_element`, `s_t3`, `s_tag`, `s_tag_label`, `s_tag_rep`

치환자 토큰 전체(기능별):

**전역·블로그:** `[##_blog_image_##]`, `[##_blog_link_##]`, `[##_blog_menu_##]`, `[##_body_id_##]`, `[##_owner_url_##]`, `[##_page_title_##]`, `[##_title_##]`
**검색:** `[##_search_name_##]`, `[##_search_onclick_submit_##]`, `[##_search_text_##]`
**게시글·관련 글·보호글:** `[##_article_dissolve_##]`, `[##_article_password_##]`, `[##_article_related_rep_link_##]`, `[##_article_related_rep_thumbnail_link_##]`, `[##_article_related_rep_title_##]`, `[##_article_rep_author_##]`, `[##_article_rep_category_##]`, `[##_article_rep_desc_##]`, `[##_article_rep_link_##]`, `[##_article_rep_simple_date_##]`, `[##_article_rep_summary_##]`, `[##_article_rep_thumbnail_raw_url_##]`, `[##_article_rep_thumbnail_url_##]`, `[##_article_rep_title_##]`, `[##_article_rep_title_text_##]`
**커버:** `[##_cover_item_comment_count_##]`, `[##_cover_item_simple_date_##]`, `[##_cover_item_summary_##]`, `[##_cover_item_thumbnail_##]`, `[##_cover_item_title_##]`, `[##_cover_item_url_##]`, `[##_cover_title_##]`, `[##_cover_url_##]`
**카테고리·태그·목록·페이징:** `[##_category_list_##]`, `[##_list_conform_##]`, `[##_list_count_##]`, `[##_next_page_##]`, `[##_no_more_next_##]`, `[##_no_more_prev_##]`, `[##_paging_rep_link_##]`, `[##_paging_rep_link_num_##]`, `[##_prev_page_##]`, `[##_tag_label_rep_##]`, `[##_tag_link_##]`, `[##_tag_name_##]`
**댓글·방명록·사이드바·카운터:** `[##_comment_group_##]`, `[##_count_today_##]`, `[##_count_total_##]`, `[##_count_yesterday_##]`, `[##_guestbook_group_##]`, `[##_notice_rep_desc_##]`, `[##_notice_rep_link_##]`, `[##_notice_rep_simple_date_##]`, `[##_notice_rep_thumbnail_raw_url_##]`, `[##_notice_rep_title_##]`, `[##_rctps_rep_link_##]`, `[##_rctps_rep_simple_date_##]`, `[##_rctps_rep_thumbnail_##]`, `[##_rctps_rep_title_##]`, `[##_rctrp_rep_desc_##]`, `[##_rctrp_rep_link_##]`
**광고·관리:** `[##_revenue_list_lower_##]`, `[##_revenue_list_upper_##]`, `[##_s_ad_isolation_##]`
**사용자 설정:** `[##_var_facebook-link_##]`, `[##_var_facebook-timeline_##]`, `[##_var_footer-text-1_##]`, `[##_var_footer-text-2_##]`, `[##_var_instagram-link_##]`, `[##_var_layout-aside_##]`, `[##_var_list-type_##]`, `[##_var_logo_##]`, `[##_var_order-link-1-title_##]`, `[##_var_order-link-1-url_##]`, `[##_var_order-link-2-title_##]`, `[##_var_order-link-2-url_##]`, `[##_var_order-link-3-title_##]`, `[##_var_order-link-3-url_##]`, `[##_var_order-link-4-title_##]`, `[##_var_order-link-4-url_##]`, `[##_var_point-color_##]`, `[##_var_promotion-1-btn-color_##]`, `[##_var_promotion-1-btn-hover-color_##]`, `[##_var_promotion-1-color_##]`, `[##_var_promotion-1-image_##]`, `[##_var_promotion-1-text_##]`, `[##_var_promotion-1-url_##]`, `[##_var_promotion-2-btn-color_##]`, `[##_var_promotion-2-btn-hover-color_##]`, `[##_var_promotion-2-color_##]`, `[##_var_promotion-2-image_##]`, `[##_var_promotion-2-text_##]`, `[##_var_promotion-2-url_##]`, `[##_var_promotion-3-btn-color_##]`, `[##_var_promotion-3-btn-hover-color_##]`, `[##_var_promotion-3-color_##]`, `[##_var_promotion-3-image_##]`, `[##_var_promotion-3-text_##]`, `[##_var_promotion-3-url_##]`, `[##_var_twitter-link_##]`, `[##_var_twitter-timeline_##]`, `[##_var_view-more_##]`, `[##_var_youtube-link_##]`

서버 치환 영역의 이름이나 범위, Tistory 생성 DOM의 클래스/ID는 바꾸지 않습니다. fixture는 브라우저 DOM 동작을 모의할 뿐 Tistory 서버의 실제 치환 결과를 대체하지 않습니다.

## 감사 결과와 CSS 변경 기록

기준 CSS는 5,729줄이었습니다. 같은 선택자가 상태·미디어 쿼리·후속 수정 레이어에서 반복되었고, 단순 규칙 스캔으로 약 258개 선택자 팔이 중복 정의되어 있었습니다. `!important` 선언은 113회, 고유 CSS 변수는 25개였습니다. 라이트/다크 전환은 기본 변수와 `prefers-color-scheme`으로 이미 시작되어 있었지만, 사용하지 않는 수동 테마 UI 및 모드별 `:has()` 규칙이 이를 다시 덮었습니다.

주요 충돌과 처리 이유:

| 영역 | 기존 충돌 | 처리 |
|---|---|---|
| 테마 | 자동/라이트/다크 UI와 시스템 테마 규칙이 동시 존재 | UI와 미사용 모드 선택자를 제거하고 시스템 변수 구조만 유지 |
| 본문 다크 모드 | 제목·문단·목록과 내부 강조를 한꺼번에 `!important` 색상/배경으로 덮음 | 인라인 검정/흰색에 한정해 보정하고 코드·링크·OG·표·인용·미디어는 별도 스타일 유지 |
| 코드 블록 | `pre`, `code.hljs`, 프레임에서 padding/background가 겹치고 복사 버튼 공간 때문에 상단에 48px가 추가됨 | `pre` 하나에만 내부 padding과 가로 스크롤, 바깥 frame에 세로 margin, code highlight 안쪽 padding/테두리 제거 |
| 관련 글 | 기존 `figure { height: 0; padding-bottom: ... }`와 이후 `img { height: 100% }`가 충돌 | 고정 `aspect-ratio` 상자 하나를 사용하고 실제 이미지는 `object-fit: cover`; 빈 figure에는 CSS 배경 |
| 댓글/Namecard | Tistory 동적 요소의 흰 배경과 텍스트를 여러 `!important` 블록이 반복 지정 | 제공된 동적 클래스만 토큰 기반으로 지정하고 DOM/이벤트는 건드리지 않음 |
| 게시글 커버 | `overflow:hidden`이 `.layer_edit.layer_open`을 자를 수 있음 | 커버 클리핑을 없애고 원형 장식을 둥근 커버 안쪽에 배치 |
| 검색/페이징 | 검색 열기와 제출 동작 혼동, pager wrap 및 기존 스프라이트/float 영향 | 돋보기는 포커스만 열고 Tistory 제출 매크로 유지; 본문 pager는 한 줄+가로 스크롤 |
| 헤더 | 모바일 제목 앞 CSS 가상 요소로 장식용 `F` 표시 | `F` 가상 요소만 제거하고 블로그 제목과 설정 로고 유지 |

기존 Tistory CSS와 화면별 규칙은 그대로 두고, 후속 Frilume 레이어의 충돌 블록을 해당 컴포넌트별 규칙으로 합쳤습니다. 기준 CSS의 주석 시작이 빠져 파서 오류를 만들던 구간도 올바른 구획 주석으로 수정했습니다. `!important`는 원본 Tistory 인쇄/편집기 호환 규칙에 남아 있고, 신규 다크 본문 보정에서 인라인 작성 색을 이겨야 하는 좁은 선택자에만 사용합니다. 총 사용량은 113회에서 72회로 줄었습니다.

## 외부 의존성 및 알려진 한계

저장소에는 현재 사용할 수 있는 `images/script.js`와 `images/ico_package.png`, `images/ico_package_2x.png`가 없습니다. HTML의 `./images/script.js` 참조는 기능을 조사하지 않은 채 삭제하지 않고 보존했습니다. 이 파일이 없으므로 프로필/탭 등 기존 템플릿의 일부 동작은 이 저장소만으로 확인할 수 없습니다. CSS의 스프라이트 아이콘도 실제 배포에서 제공되지 않으면 표시되지 않을 수 있습니다.

외부 자산/런타임은 Tistory jQuery 1.12.4, Facebook SDK, X 위젯, Tistory 썸네일 변환 URL 및 Tistory 에디터 SVG입니다. 사용자의 설정 로고/본문 이미지도 Tistory 또는 외부 URL에서 제공됩니다. 네트워크 차단 또는 제3자 서비스 변경은 로컬 fixture에서 검증되지 않습니다.

실제 Tistory 서버 없이 확인할 수 없는 항목은 치환자 렌더링, 관리 레이어 권한/표시, 로그인 상태, 댓글·답글 전송, 동적 Namecard DOM, 실제 검색 URL 및 페이징 이동입니다. 이 항목들은 설치 뒤 수동 확인이 필요하며, mock 테스트 결과를 실제 Tistory 서버 통과로 간주하지 않습니다.

## 라이선스 및 재배포

저장소에 `LICENSE` 파일이나 재배포 허가 문구가 없습니다. 이 변경으로 MIT 등 새 라이선스를 부여하지 않았습니다. 스킨 원본의 저작권자/라이선스와 수정본의 공개·재배포 가능 여부를 저장소 관리자에게 확인한 뒤 배포하세요.

## 검증 결과

- `npm run test:visual`: Playwright Chromium 16개 시나리오 통과
- 정적 검사: Tistory placeholder/tag 빈도 보존, PostCSS 파싱, 인라인 복사 스크립트 구문 검사 통과
- 화면: 390px/768px/1024px/1440px, 라이트·다크, 홈/카테고리/검색/게시글 fixture
- 기능: 검색 아이콘만으로 미제출, Enter/버튼 제출, 코드 복사/줄번호 제외/중복 바인딩 방지/fallback 성공·실패, 모바일 드로어와 터치 복사 버튼 확인
- 접근성/레이아웃: 포커스, 대비 기준, reduced-motion, pager 가로 스크롤, 문서 가로 넘침 검사 통과
- 실제 Tistory: 서버 측 치환 및 동적 댓글 기능은 수동 검증 전이며 성공으로 주장하지 않습니다.
