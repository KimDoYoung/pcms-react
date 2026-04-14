# calendar-공휴일정보 설계

- domain :calendar

## 개요

- 달력에 그 달에 포함되어서 스케줄, 휴일들을 표시한다.

## 설계

- 공공데이터 포털에서 공휴일 정보를 정기적으로 취득해서 table  'cms.calendar_public' 에  갱신한다. 
- cms.calendar_public의 data_type은 'Data','Action' 으로 나누어 진다.
- 예를 들어 A 시점에 공공데이터에서 데이터를 가져왔었을 때
- Action, A-YM, '데이터취득', A-YMD-TIME 이 레코드에 추가되고
- Data, A-YM의 데이터들이 모두 삭제된 후 취득된 데이터가 'Data',YMD,'추석', currenttimestamp로 저장된다.
- 


## 동작
- `PUBLIC_DATA_API_KEY` 키로 application.properties에거 api key를 가져온다.
-  get으로 요청 https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=PUBLIC_DATA_API_KEY&solYear=2015&solMonth=09
-  아래와 같은 데이터를 가져오면 가져왔다는 표시로
    'Action','202509','202509-Holiday',current_timestamp
    'Data','20250926','추석',currenttime으로 저장한다.
    ...
    와 같이 데이터를 넣는다.
```xml
<response>
<header>
<resultCode>00</resultCode>
<resultMsg>NORMAL SERVICE.</resultMsg>
</header>
<body>
<items>
<item>
<dateKind>01</dateKind>
<dateName>추석</dateName>
<isHoliday>Y</isHoliday>
<locdate>20150926</locdate>
<seq>1</seq>
</item>
<item>
<dateKind>01</dateKind>
<dateName>추석</dateName>
<isHoliday>Y</isHoliday>
<locdate>20150927</locdate>
<seq>1</seq>
</item>
<item>
<dateKind>01</dateKind>
<dateName>추석</dateName>
<isHoliday>Y</isHoliday>
<locdate>20150928</locdate>
<seq>1</seq>
</item>
<item>
<dateKind>01</dateKind>
<dateName>대체공휴일</dateName>
<isHoliday>Y</isHoliday>
<locdate>20150929</locdate>
<seq>1</seq>
</item>
</items>
<numOfRows>10</numOfRows>
<pageNo>1</pageNo>
<totalCount>4</totalCount>
</body>
</response>
```

## 개인 calendar

- table : calendar

```sql
-- cms.calendar definition

-- Drop table

-- DROP TABLE cms.calendar;

CREATE TABLE cms.calendar (
	id serial4 NOT NULL,
	gubun bpchar(1) NOT NULL,
	sorl bpchar(1) DEFAULT 'S'::bpchar NOT NULL,
	ymd varchar(8) NOT NULL,
	"content" varchar(200) NOT NULL,
	created_dt timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT calendar_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_calendar_gubun_ymd ON cms.calendar USING btree (gubun, ymd);
CREATE INDEX idx_calendar_sorl ON cms.calendar USING btree (sorl);
```
- gubun : 'Y' 매년, 'M' 매달, 'S' : 특정일 
- sorl : 'S' 양력, 'L' : 음력
- ymd : gubun이 'Y'일 경우 MMDD , 'M' 일경우 DD, 'S' 일경우  YYYYMMDD 가 들어가 있어야함.
```sql
insert into calendar(gubun, sorl, ymd, content) values('S','S','20260420','4월휴가');
insert into calendar(gubun, sorl, ymd, content) values('Y','S','0405','yh생일');
insert into calendar(gubun, sorl, ymd, content) values('M','S','01','휴대폰백업');
```
- 달력이 2026년 04월 일경우 api /calendar/2026/04 


## API 

- /fetch-public-holiday/2026/04
- table calendar_public 'Action','202604' 로 조회 존재하지 않는다면 데이터를 가져와서 calendar_public을 채운다.
- /fetch-public-holiday/2026
- 2026 01~12을 모두 가져와서 채운다.

## 음력 기념일의 처리

### 라이브러리

- [GitHub - FrancescoJo/korean-lunar-calendar](https://github.com/FrancescoJo/korean-lunar-calendar)
```json
repositories {
    maven { url 'https://jitpack.io' }
}
dependencies {
    implementation 'com.github.FrancescoJo:korean-lunar-calendar:1.0.2'
}
```

### 구현방법

- 달력의 첫번째 일자와 마지막일자를 음력으로 변환

