package kr.co.kalpa.pcms.utility.emoji.service;

import kr.co.kalpa.pcms.utility.emoji.dto.EmojiSearchResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmojiServiceImpl implements EmojiService {

    @Value("${emoji.search.url:https://www.emojiall.com/ko/search_results}")
    private String emojiSearchUrl;

    // 검색 결과 메모리 캐시
    private final Map<String, List<EmojiSearchResultDto>> searchCache = new ConcurrentHashMap<>();

    // 표준 한글 이모지 데이터셋 (외부 크롤링 실패 시 안전한 Fallback 제공)
    private static final List<EmojiSearchResultDto> LOCAL_EMOJI_DATASET = new ArrayList<>();

    static {
        addLocal("😀", "활짝 웃는 얼굴", "웃음, 미소, 기쁨, 행복, 얼굴", "1F600");
        addLocal("😃", "큰 눈으로 웃는 얼굴", "웃음, 미소, 기쁨, 행복, 얼굴", "1F603");
        addLocal("😄", "눈웃음 짓는 얼굴", "웃음, 눈웃음, 행복, 얼굴", "1F604");
        addLocal("😁", "이를 드러내고 웃는 얼굴", "웃음, 기쁨, 장난, 얼굴", "1F601");
        addLocal("😆", "눈을 감고 크게 웃는 얼굴", "폭소, 웃음, 대박, 얼굴", "1F606");
        addLocal("😅", "땀 흘리며 웃는 얼굴", "식은땀, 당황, 안도, 얼굴", "1F605");
        addLocal("🤣", "바닥을 구르며 웃는 얼굴", "폭소, 빵터짐, ㅋㅋㅋ, 얼굴", "1F923");
        addLocal("😂", "기쁨의 눈물을 흘리는 얼굴", "눈물, 감동, ㅋㅋㅋ, 얼굴", "1F602");
        addLocal("🙂", "살짝 웃는 얼굴", "미소, 긍정, 평온, 얼굴", "1F642");
        addLocal("😉", "윙크하는 얼굴", "윙크, 장난, 애교, 얼굴", "1F609");
        addLocal("😊", "수줍게 웃는 얼굴", "미소, 수줍음, 따뜻함, 얼굴", "1F60A");
        addLocal("😇", "천사 같은 얼굴", "천사, 착함, 순수, 얼굴", "1F607");
        addLocal("🥰", "하트가 가득한 얼굴", "사랑, 행복, 반함, 얼굴", "1F970");
        addLocal("😍", "하트 눈을 한 얼굴", "사랑, 반함, 최고, 하트", "1F60D");
        addLocal("🤩", "별 눈을 한 얼굴", "감탄, 반짝반짝, 스타, 별", "1F929");
        addLocal("😘", "키스를 보내는 얼굴", "키스, 사랑, 뽀뽀, 얼굴", "1F618");
        addLocal("😗", "키스하는 얼굴", "뽀뽀, 휘파람, 얼굴", "1F617");
        addLocal("😋", "맛있게 먹는 얼굴", "맛있다, 냠냠, 장난, 얼굴", "1F60B");
        addLocal("😛", "혀를 내민 얼굴", "장난, 메롱, 얼굴", "1F61B");
        addLocal("😜", "윙크하며 혀를 내민 얼굴", "메롱, 장난, 윙크, 얼굴", "1F61C");
        addLocal("🤪", "우스꽝스러운 얼굴", "엉뚱, 장난, 미친, 얼굴", "1F92A");
        addLocal("😝", "눈감고 혀를 내민 얼굴", "메롱, 장난, 웃음, 얼굴", "1F61D");
        addLocal("🤑", "돈 눈을 한 얼굴", "돈, 부자, 대박, 머니", "1F911");
        addLocal("🤗", "포옹하는 얼굴", "포옹, 따뜻함, 환영, 손", "1F917");
        addLocal("🤭", "입을 가리고 웃는 얼굴", "어머, 풋, 비밀, 얼굴", "1F92D");
        addLocal("🤫", "쉿하는 얼굴", "조용, 비밀, 쉿, 얼굴", "1F92B");
        addLocal("🤔", "생각하는 얼굴", "고민, 생각, 물음표, 얼굴", "1F914");
        addLocal("🤐", "지퍼 입 얼굴", "비밀, 침묵, 조용, 얼굴", "1F910");
        addLocal("🤨", "눈썹을 치켜올린 얼굴", "의심, 뭐지, 불신, 얼굴", "1F928");
        addLocal("😐", "무표정한 얼굴", "정색, 무표정, 멍, 얼굴", "1F610");
        addLocal("😑", "표정 없는 얼굴", "정색, 어이없음, 얼굴", "1F611");
        addLocal("😶", "입 없는 얼굴", "말잇못, 침묵, 얼굴", "1F636");
        addLocal("😏", "비웃는 얼굴", "능글, 비웃음, 자신감, 얼굴", "1F60F");
        addLocal("😒", "불만 가득한 얼굴", "불만, 삐침, 짜증, 얼굴", "1F612");
        addLocal("🙄", "눈을 굴리는 얼굴", "한심, 어이없음, 딴청, 얼굴", "1F644");
        addLocal("😬", "이를 악문 얼굴", "당황, 아차, 곤란, 얼굴", "1F62C");
        addLocal("🤥", "거짓말쟁이 얼굴", "피노키오, 거짓말, 긴코", "1F925");
        addLocal("😌", "안도하는 얼굴", "안심, 평온, 휴식, 얼굴", "1F60C");
        addLocal("😔", "풀 죽은 얼굴", "시무룩, 우울, 반성, 얼굴", "1F614");
        addLocal("😪", "졸린 얼굴", "졸림, 졸려, 콧물, 잠", "1F62A");
        addLocal("🤤", "침 흘리는 얼굴", "침, 꿀맛, 졸림, 얼굴", "1F924");
        addLocal("😴", "자는 얼굴", "잠, 쿨쿨, 취침, 잠자기", "1F634");
        addLocal("😷", "마스크 쓴 얼굴", "마스크, 감기, 코로나, 병", "1F637");
        addLocal("🤒", "체온계 문 얼굴", "열, 감기, 환자, 아픔", "1F912");
        addLocal("🤕", "붕대 감은 얼굴", "부상, 다침, 환자, 아픔", "1F915");
        addLocal("🤢", "메스꺼운 얼굴", "구역질, 멀미, 메스꺼움, 얼굴", "1F922");
        addLocal("🤮", "토하는 얼굴", "구토, 우웩, 토, 얼굴", "1F92E");
        addLocal("🤧", "재채기하는 얼굴", "에취, 감기, 비염, 휴지", "1F927");
        addLocal("🥵", "더위에 지친 얼굴", "더움, 폭염, 땀, 여름", "1F975");
        addLocal("🥶", "추위에 떠는 얼굴", "추움, 한파, 얼음, 겨울", "1F976");
        addLocal("🥴", "어지러운 얼굴", "취함, 멍함, 어지러움, 술", "1F974");
        addLocal("😵", "기절한 얼굴", "어지러움, 기절, 멘붕, 얼굴", "1F635");
        addLocal("🤯", "머리가 터질 듯한 얼굴", "충격, 멘붕, 대박, 폭발", "1F92F");
        addLocal("🥳", "파티하는 얼굴", "파티, 축하, 생일, 이벤트", "1F973");
        addLocal("😎", "선글라스 낀 얼굴", "멋짐, 쿨함, 선글라스, 자신감", "1F60E");
        addLocal("🤓", "안경 쓴 범생이 얼굴", "안경, 공부, 개발자, 너드", "1F913");
        addLocal("🧐", "단안경 낀 얼굴", "조사, 관찰, 탐정, 돋보기", "1F9D0");
        addLocal("😕", "혼란스러운 얼굴", "물음표, 갸우뚱, 의아, 얼굴", "1F615");
        addLocal("😟", "걱정스러운 얼굴", "걱정, 불안, 근심, 얼굴", "1F61F");
        addLocal("🙁", "살짝 찌푸린 얼굴", "슬픔, 불만, 찌푸림, 얼굴", "1F641");
        addLocal("😮", "입 벌리고 놀란 얼굴", "놀람, 헉, 감탄, 얼굴", "1F62E");
        addLocal("😯", "멍하니 놀란 얼굴", "헉, 깜짝, 멍, 얼굴", "1F62F");
        addLocal("😲", "경악한 얼굴", "경악, 대박, 깜짝, 얼굴", "1F632");
        addLocal("😳", "볼이 빨개진 얼굴", "부끄러움, 당황, 깜짝, 얼굴", "1F633");
        addLocal("🥺", "애원하는 얼굴", "플리즈, 제발, 초롱초롱, 감동", "1F97A");
        addLocal("😦", "입을 벌린 얼굴", "놀람, 멍, 얼굴", "1F626");
        addLocal("😨", "두려워하는 얼굴", "공포, 무서움, 두려움, 얼굴", "1F628");
        addLocal("😰", "식은땀 흘리는 얼굴", "불안, 초조, 식은땀, 얼굴", "1F630");
        addLocal("😥", "슬픈 안도의 얼굴", "안도, 한숨, 다행, 얼굴", "1F625");
        addLocal("😢", "눈물 흘리는 얼굴", "눈물, 슬픔, 울음, 흑흑", "1F622");
        addLocal("😭", "엉엉 우는 얼굴", "대성통곡, 눈물, ㅠㅠ, 슬픔", "1F62D");
        addLocal("😱", "비명 지르는 얼굴", "경악, 절규, 공포, 멘붕", "1F631");
        addLocal("😖", "괴로워하는 얼굴", "괴로움, 답답, 스트레스, 얼굴", "1F616");
        addLocal("😣", "인내하는 얼굴", "참을인, 버팀, 인내, 얼굴", "1F623");
        addLocal("😞", "실망한 얼굴", "실망, 낙담, 우울, 얼굴", "1F61E");
        addLocal("😓", "식은땀 뻘뻘 얼굴", "난감, 땀, 힘듦, 얼굴", "1F613");
        addLocal("😩", "지친 얼굴", "피곤, 지침, 힘듦, 얼굴", "1F629");
        addLocal("😫", "피곤한 얼굴", "피로, 넉다운, 지침, 얼굴", "1F62B");
        addLocal("🥱", "하품하는 얼굴", "하품, 지루, 졸림, 잠", "1F971");
        addLocal("😤", "콧김 뿜는 얼굴", "자신감, 분노, 흥, 얼굴", "1F624");
        addLocal("😡", "화난 얼굴", "분노, 빡침, 화남, 빨간얼굴", "1F621");
        addLocal("😠", "성난 얼굴", "화남, 찌푸림, 분노, 얼굴", "1F620");
        addLocal("🤬", "욕설하는 얼굴", "욕, 분노, 삐처리, 화남", "1F92C");
        addLocal("😈", "미소 짓는 악마", "악마, 장난, 빌런, 보라", "1F608");
        addLocal("👿", "화난 악마", "악마, 분노, 뿔, 보라", "1F47F");
        addLocal("💀", "해골", "해골, 죽음, 뼈, 위험", "1F480");
        addLocal("💩", "똥", "똥, 대변, 장난, 유머", "1F4A9");
        addLocal("🤡", "광대", "광대, 삐에로, 서커스, 장난", "1F921");
        addLocal("👻", "유령", "유령, 귀신, 할로윈, 장난", "1F47B");
        addLocal("👽", "외계인", "외계인, UFO, 우주, 미지의존재", "1F47D");
        addLocal("🤖", "로봇", "로봇, AI, 기계, 인공지능", "1F916");

        // 손/제스처
        addLocal("👍", "엄지 척", "좋아요, 최고, 추천, 굿, 엄지", "1F44D");
        addLocal("👎", "엄지 아래", "싫어요, 비추, 별로, 비동의", "1F44E");
        addLocal("👏", "박수", "박수, 짝짝짝, 축하, 칭찬, 응원", "1F44F");
        addLocal("🙌", "만세", "만세, 환호, 축하, 양손", "1F64C");
        addLocal("👐", "벌린 손", "열린손, 환영, 안아주기", "1F450");
        addLocal("🤲", "손 모으기", "기도, 모음, 받기, 손", "1F932");
        addLocal("🤝", "악수", "악수, 동의, 계약, 협력, 인사", "1F91F");
        addLocal("🙏", "기도하는 손", "기도, 부탁, 감사, 합장, 제발", "1F64F");
        addLocal("✌️", "브이", "브이, 승리, 평화, 가위", "270C");
        addLocal("🤞", "행운을 비는 손가락", "행운, 행운을빌어, 크로스", "1F91E");
        addLocal("🤟", "사랑해 손짓", "사랑해, 락, 하트, 손", "1F91F");
        addLocal("🤘", "락앤롤 손짓", "락, 메탈, 파티, 뿔", "1F918");
        addLocal("👌", "OK 손짓", "오케이, 확인, 알겠어, 완벽", "1F44C");
        addLocal("🤌", "모은 손가락", "이탈리아제스처, 뭐라구, 손", "1F90C");
        addLocal("🤏", "조금 손짓", "조금, 꼬집기, 살짝, 작음", "1F90F");
        addLocal("👈", "왼쪽 가리키는 손", "왼쪽, 가리키기, 손가락", "1F448");
        addLocal("👉", "오른쪽 가리키는 손", "오른쪽, 가리키기, 손가락", "1F449");
        addLocal("👆", "위 가리키는 손", "위, 위쪽, 저기, 손가락", "1F446");
        addLocal("👇", "아래 가리키는 손", "아래, 아래쪽, 참고, 손가락", "1F447");
        addLocal("☝️", "검지 든 손", "첫째, 주목, 잠깐, 손가락", "261D");
        addLocal("✋", "펼친 손", "멈춤, 정지, 손바닥, 안녕", "270B");
        addLocal("🤚", "손등 보인 손", "손등, 멈춤, 손", "1F91A");
        addLocal("🖐️", "손가락 벌린 손", "손바닥, 다섯, 안녕, 손", "1F590");
        addLocal("🖖", "벌컨 인사", "스타트렉, 인사, 손", "1F596");
        addLocal("👋", "흔드는 손", "안녕, 바이바이, 인사, 반가워", "1F44B");
        addLocal("🤙", "전화 손짓", "전화해, 연락해, 하와이인사", "1F919");
        addLocal("💪", "근육 팔", "근육, 힘, 화이팅, 운동, 헬스", "1F4AA");

        // 하트 & 감정
        addLocal("❤️", "빨간 하트", "하트, 사랑, 애정, 좋아, 빨강", "2764");
        addLocal("🧡", "주황 하트", "하트, 사랑, 주황, 우정", "1F9E1");
        addLocal("💛", "노란 하트", "하트, 사랑, 노랑, 따뜻", "1F49B");
        addLocal("💚", "초록 하트", "하트, 사랑, 초록, 자연", "1F49A");
        addLocal("💙", "파란 하트", "하트, 사랑, 파랑, 신뢰", "1F499");
        addLocal("💜", "보라 하트", "하트, 사랑, 보라, BTS", "1F49C");
        addLocal("🖤", "검은 하트", "하트, 사랑, 검정, 시크", "1F5A4");
        addLocal("🤍", "하얀 하트", "하트, 사랑, 순수, 흰색", "1F90D");
        addLocal("🤎", "갈색 하트", "하트, 사랑, 브라운, 갈색", "1F90E");
        addLocal("💔", "깨진 하트", "실연, 이별, 상처, 슬픔, 하트", "1F494");
        addLocal("❣️", "하트 느낌표", "하트, 강조, 사랑, 느낌표", "2763");
        addLocal("💕", "두 개의 하트", "하트, 사랑, 핑크, 애정", "1F495");
        addLocal("💞", "회전하는 하트", "하트, 사랑, 설렘, 핑크", "1F49E");
        addLocal("💓", "뛰는 하트", "하트, 심쿵, 두근두근, 설렘", "1F493");
        addLocal("💗", "자라나는 하트", "하트, 사랑, 설렘, 핑크", "1F497");
        addLocal("💖", "반짝이는 하트", "하트, 블링블링, 사랑, 반짝", "1F496");
        addLocal("💘", "화살 맞은 하트", "큐피드, 사랑, 반함, 화살", "1F498");
        addLocal("💝", "리본 달린 하트", "선물, 사랑, 마음, 리본", "1F49D");
        addLocal("🔥", "불", "불, 불꽃, 화이어, 열정, 핫, 인기", "1F525");
        addLocal("✨", "반짝임", "반짝반짝, 별, 빛, 마법, 클린", "2728");
        addLocal("⭐", "별", "별, 스타, 최고, 평점, 골드", "2B50");
        addLocal("🌟", "빛나는 별", "별, 반짝임, 영광, 스타", "1F31F");
        addLocal("💫", "어지러운 별", "별, 핑핑, 어지러움, 반짝", "1F4AB");
        addLocal("💥", "충돌/폭발", "폭발, 쾅, 대박, 충격, 번쩍", "1F4A5");
        addLocal("💯", "100점", "100점, 백점, 만점, 최고, 완벽", "1F4AF");
        addLocal("💢", "분노 마크", "화남, 분노, 빡침, 만화", "1F4A2");
        addLocal("💬", "말풍선", "대화, 메시지, 토크, 댓글", "1F4AC");
        addLocal("💭", "생각 풍선", "생각, 고민, 상상, 풍선", "1F4AD");

        // 자연 & 날씨 & 산
        addLocal("⛰️", "산", "산, 등산, 자연, 산림, 마운틴", "26F0");
        addLocal("🏔️", "눈 덮인 산", "산, 설산, 겨울산, 등산, 눈", "1F3D4");
        addLocal("🌋", "화산", "화산, 용암, 폭발, 산, 마그마", "1F30B");
        addLocal("🛘", "산사태", "산사태, 낙석, 재해, 돌, 사태, 산", "1F6D8");
        addLocal("🛙", "등대", "등대, 바다, 항구, 안내, 빛, 해변", "1F6D9");
        addLocal("🏖️", "해변/파라솔", "바다, 해변, 휴가, 모래사장", "1F3D6");
        addLocal("🏝️", "무인도/섬", "섬, 휴양지, 야자수, 바다", "1F3DD");
        addLocal("🏜️", "사막", "사막, 모래, 선인장, 더위", "1F3DC");
        addLocal("🏕️", "캠핑", "캠핑, 텐트, 야영, 자연, 숲", "1F3D5");
        addLocal("🌲", "상록수", "나무, 소나무, 전나무, 숲, 크리스마스", "1F332");
        addLocal("🌳", "낙엽수", "나무, 숲, 자연, 공원", "1F333");
        addLocal("🌴", "야자수", "야자수, 열대, 바다, 휴양지", "1F334");
        addLocal("🌱", "새싹", "새싹, 식물, 시작, 봄, 성장", "1F331");
        addLocal("🌿", "허브/풀", "풀, 나뭇잎, 허브, 식물, 자연", "1F33F");
        addLocal("🍀", "네잎클로버", "행운, 클로버, 풀, 네잎", "1F340");
        addLocal("🌸", "벚꽃", "벚꽃, 꽃, 봄, 사쿠라, 핑크", "1F338");
        addLocal("🌹", "장미", "장미, 꽃, 로즈, 사랑, 빨강", "1F339");
        addLocal("🌻", "해바라기", "해바라기, 꽃, 노랑, 여름", "1F33B");
        addLocal("🍁", "단풍잎", "단풍, 가을, 낙엽, 빨강", "1F341");
        addLocal("🍂", "낙엽", "낙엽, 가을, 바람, 갈색", "1F342");
        addLocal("☀️", "맑은 해", "해, 맑음, 태양, 날씨, 낮", "2600");
        addLocal("⛅", "구름 낀 해", "구름, 흐림, 날씨, 조금흐림", "26C5");
        addLocal("🌧️", "비 내리는 구름", "비, 우산, 장마, 날씨, 레인", "1F327");
        addLocal("❄️", "눈송이", "눈, 겨울, 스노우, 추움, 얼음", "2744");
        addLocal("🌈", "무지개", "무지개, 레인보우, 희망, 하늘", "1F308");

        // 음식 & 스프/수프
        addLocal("🍲", "스프/찌개/수프", "스프, 수프, 국, 찌개, 뚝배기, 탕, 음식, 밥, 팟", "1F372");
        addLocal("🍜", "라면/국수", "라면, 라멘, 국수, 면, 젓가락, 음식", "1F35C");
        addLocal("🍚", "쌀밥", "밥, 쌀밥, 공깃밥, 식사, 한식, 음식", "1F35A");
        addLocal("🍛", "카레 라이스", "카레, 덮밥, 밥, 식사, 음식", "1F35B");
        addLocal("🍙", "주먹밥", "오니기리, 삼각김밥, 주먹밥, 음식", "1F359");
        addLocal("🍱", "도시락", "도시락, 벤토, 식사, 정식, 음식", "1F371");
        addLocal("🍔", "햄버거", "햄버거, 버거, 패스트푸드, 음식", "1F354");
        addLocal("🍕", "피자", "피자, 치즈, 패스트푸드, 음식", "1F355");
        addLocal("🥩", "고기/스테이크", "고기, 소고기, 스테이크, 음식", "1F969");
        addLocal("🍗", "치킨/닭다리", "치킨, 통닭, 닭다리, 고기, 음식", "1F357");
        addLocal("🥗", "샐러드", "샐러드, 야채, 채소, 건강식, 다이어트", "1F957");
        addLocal("🍞", "식빵", "빵, 식빵, 베이커리, 토스트, 음식", "1F35E");
        addLocal("🥪", "샌드위치", "샌드위치, 빵, 간식, 음식", "1F96A");
        addLocal("☕", "뜨거운 커피", "커피, 카페, 차, 아메리카노, 음료", "2615");
        addLocal("🍺", "맥주", "맥주, 술, 건배, 펍, 치맥", "1F37A");
        addLocal("🍻", "맥주 건배", "건배, 짠, 축배, 술, 회식", "1F37B");
        addLocal("🍷", "와인", "와인, 포도주, 술, 분위기", "1F377");
        addLocal("🍎", "사과", "사과, 과일, 빨강, 애플, 음식", "1F34E");
        addLocal("🍌", "바나나", "바나나, 과일, 노랑, 음식", "1F34C");
        addLocal("🍓", "딸기", "딸기, 과일, 베리, 디저트, 음식", "1F353");
        addLocal("🍰", "케이크", "케이크, 생일, 축하, 디저트, 빵", "1F370");
        addLocal("🍦", "아이스크림", "아이스크림, 디저트, 콘, 여름", "1F366");

        // 사물 & IT & 도구 & 기호
        addLocal("💻", "노트북", "노트북, 컴퓨터, 코딩, 개발, PC", "1F4BB");
        addLocal("🖥️", "데스크톱 컴퓨터", "컴퓨터, 모니터, PC, 전산", "1F5A5");
        addLocal("📱", "스마트폰", "스마트폰, 핸드폰, 모바일, 전화기", "1F4F1");
        addLocal("📞", "전화기", "전화, 수화기, 연락, 콜", "1F4DE");
        addLocal("📁", "파일 폴더", "폴더, 파일, 문서, 서류", "1F4C1");
        addLocal("📂", "열린 폴더", "폴더, 파일, 열림, 디렉터리", "1F4C2");
        addLocal("📄", "문서", "문서, 파일, 종이, 페이지, 리포트", "1F4C4");
        addLocal("📑", "북마크 탭/PDF", "PDF, 탭, 북마크, 서류, 문서", "1F4D1");
        addLocal("📊", "막대 그래프", "차트, 그래프, 통계, 분석, 보고서", "1F4CA");
        addLocal("📈", "상승 차트", "상승, 주식, 떡상, 성장, 차트", "1F4C8");
        addLocal("📉", "하락 차트", "하락, 주가, 떡락, 감소, 차트", "1F4C9");
        addLocal("📝", "메모/연필", "메모, 글쓰기, 작성, 수정, 노트", "1F4DD");
        addLocal("📌", "압정", "핀, 고정, 중요, 게시, 위치", "1F4CC");
        addLocal("📍", "둥근 핀", "위치, 장소, 지도, 핀, 로케이션", "1F4CD");
        addLocal("📎", "클립", "첨부, 클립, 파일, 링크", "1F4CE");
        addLocal("🔍", "돋보기(검색)", "검색, 찾기, 조회, 탐색, 돋보기", "1F50D");
        addLocal("🔎", "우측 돋보기", "검색, 찾기, 확대, 돋보기", "1F50E");
        addLocal("🔒", "자물쇠(잠김)", "잠금, 보안, 비밀, 프라이빗", "1F512");
        addLocal("🔓", "열린 자물쇠", "잠금해제, 공개, 오픈", "1F513");
        addLocal("🔑", "열쇠", "키, 비밀번호, 해결, 열쇠", "1F511");
        addLocal("⚙️", "톱니바퀴(설정)", "설정, 옵션, 구성, 시스템, 기어", "2699");
        addLocal("🛠️", "도구/유틸리티", "유틸리티, 도구, 수리, 망치, 렌치", "1F6E0");
        addLocal("⏰", "알람 시계", "시계, 알람, 시간, 타임", "23F0");
        addLocal("📅", "달력", "달력, 캘린더, 일정, 날짜, 일지", "1F4C5");
        addLocal("🚗", "자동차", "자동차, 차, 드라이브, 교통, 이동", "1F697");
        addLocal("✈️", "비행기", "비행기, 여행, 공항, 항공, 출장", "2708");
        addLocal("🚀", "로켓", "로켓, 우주, 발사, 급상승, 스타트업", "1F680");
        addLocal("💡", "전구(아이디어)", "전구, 아이디어, 영감, 생각, 팁", "1F4A1");
        addLocal("💰", "돈자루", "돈, 머니, 부자, 금융, 자산, 골드", "1F4B0");
        addLocal("💵", "지폐/달러", "돈, 달러, 현금, 화폐", "1F4B5");
        addLocal("💳", "신용카드", "카드, 결제, 체크카드, 금융", "1F4B3");
        addLocal("🎁", "선물 상자", "선물, 축하, 이벤트, 기프트, 박스", "1F381");
        addLocal("🎉", "폭죽/파티", "축하, 파티, 경축, 이벤트, 팡파르", "1F389");
        addLocal("✅", "체크 표시", "완료, 체크, 확인, 성공, 통과", "2705");
        addLocal("❌", "엑스 표시", "취소, 실패, 오류, 엑스, 금지", "274C");
        addLocal("⚠️", "경고 표시", "경고, 주의, 위험, 알림", "26A0");
        addLocal("🚫", "금지 표시", "금지, 불가, 차단, 멈춤", "1F6AB");
        addLocal("❓", "물음표", "질문, 물음표, 의문, 헬프", "2753");
        addLocal("❗", "느낌표", "느낌표, 주의, 중요, 알림", "2757");
        addLocal("⭐", "별점", "별, 평가, 즐겨찾기, 중요", "2B50");
    }

    private static void addLocal(String emoji, String name, String keywords, String code) {
        LOCAL_EMOJI_DATASET.add(EmojiSearchResultDto.builder()
                .emoji(emoji)
                .name(name)
                .keywords(keywords)
                .code(code)
                .build());
    }

    @Override
    public List<EmojiSearchResultDto> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return Collections.emptyList();
        }

        String trimmed = keyword.trim();
        String cacheKey = trimmed.toLowerCase();

        // 1. 캐시 확인
        List<EmojiSearchResultDto> cached = searchCache.get(cacheKey);
        if (cached != null) {
            log.debug("Emoji 검색 캐시 히트: {} ({}건)", trimmed, cached.size());
            return cached;
        }

        // 2. 외부 emojiall.com 스크래핑 시도
        List<EmojiSearchResultDto> results = crawlFromEmojiall(trimmed);

        // 3. 외부 결과가 없거나 실패 시 로컬 한글 Unicode 데이터셋 검색
        if (results.isEmpty()) {
            results = searchLocalDataset(trimmed);
            log.info("로컬 이모지 데이터셋 검색: '{}' → {}건", trimmed, results.size());
        }

        // 캐시 저장 (최대 500개 유지)
        if (!results.isEmpty()) {
            if (searchCache.size() > 500) {
                searchCache.clear();
            }
            searchCache.put(cacheKey, results);
        }

        return results;
    }

    private List<EmojiSearchResultDto> crawlFromEmojiall(String keyword) {
        List<EmojiSearchResultDto> list = new ArrayList<>();
        try {
            String encoded = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            String url = emojiSearchUrl.replaceAll("/+$", "") + "?keywords=" + encoded;

            log.info("emojiall.com 크롤링 요청: {}", url);

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                    .header("Referer", "https://www.emojiall.com/ko")
                    .timeout(5000)
                    .get();

            // 검색 결과가 없는 경우 확인
            Element emptyCheck = doc.selectFirst(".emoji_card_list .emoji_card_content");
            if (emptyCheck != null && emptyCheck.text().contains("관련 검색결과가 없습니다")) {
                log.info("emojiall 검색 결과 없음: {}", keyword);
                return list;
            }

            // 검색 결과 리스트 아이템 파싱
            Elements rows = doc.select(".emoji_card_list li.row");
            for (Element row : rows) {
                // 이모지 문자 추출
                String emoji = "";
                Element fontEl = row.selectFirst(".emoji_font");
                if (fontEl != null) {
                    emoji = fontEl.text().trim();
                }
                if (emoji.isEmpty()) {
                    Element btn = row.selectFirst("button[data-clipboard-text]");
                    if (btn != null) {
                        emoji = btn.attr("data-clipboard-text").trim();
                    }
                }
                if (emoji.isEmpty()) continue;

                // 이모지 이름/키워드 추출
                String name = "";
                Element nameEl = row.selectFirst(".col.grow p.mb_half a");
                if (nameEl != null) {
                    name = nameEl.text().replaceAll("^[\\p{So}\\p{Cs}\\s]+", "").trim();
                }

                // 태그 목록 추출
                Elements tagEls = row.select("a.text_blue");
                String tags = tagEls.eachText().stream()
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(", "));

                // 코드 추출 (href 예: /ko/emoji/%F0%9F%9B%98)
                String code = "";
                Element linkEl = row.selectFirst("a[href*='/emoji/']");
                if (linkEl != null) {
                    String href = linkEl.attr("href");
                    int lastSlash = href.lastIndexOf('/');
                    if (lastSlash > 0) {
                        code = href.substring(lastSlash + 1);
                    }
                }

                list.add(EmojiSearchResultDto.builder()
                        .emoji(emoji)
                        .name(name.isEmpty() ? keyword : name)
                        .keywords(tags)
                        .code(code)
                        .build());
            }

            log.info("emojiall 크롤링 성공: {}건 파싱", list.size());
        } catch (Exception e) {
            log.warn("emojiall 크롤링 중 예외 발생 (Fallback 전환): {}", e.getMessage());
        }
        return list;
    }

    private List<EmojiSearchResultDto> searchLocalDataset(String keyword) {
        String lower = keyword.toLowerCase();
        return LOCAL_EMOJI_DATASET.stream()
                .filter(e -> e.getName().toLowerCase().contains(lower)
                        || (e.getKeywords() != null && e.getKeywords().toLowerCase().contains(lower))
                        || e.getEmoji().equals(keyword))
                .collect(Collectors.toList());
    }
}
