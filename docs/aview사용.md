 파일관리 메뉴(ApNodePage)에서 보기 기능을 넣으려고 함.
 
 파일 리스트에 이미지, pdf, 기타등등 보기 기능이 없어서 그것을 추가하려고 함. 
 그런데. AView라는  /home/kdy987/work/aview-with-java/README.md 유틸리티 app 이 있음
 AView app을 이용해서 보기를 구현하려고 하.ㅁ
 
 1. 파일 card 에서 view icon(eye icon) 추가 
 2. eye icon click시 또는 double 클릭시
 3. 해당파일을 file.temp-dir=${kalpa.pcms.base-dir}/temp/aview 폴더로 copy (aview가 없으면 폴더 생성)
 4. aview 호출 example, url과 onm을 파라메터로 줌
    http://jskn.iptime.org/aview/view?url=http://jskn.iptime.org/aview/admin/run-test/download/2.png&onm=원래이름.png
 5. http://jskn.iptime.org/aview/view 즉 aview url은 application.properties에  'aview.url' 로 기술
 6. 보안 file.temp-dir=${kalpa.pcms.base-dir}/temp 하위의 모든 url은 그대로 제공 jwt 보안 무시하고 제공
 