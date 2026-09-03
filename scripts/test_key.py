# -*- coding: utf-8 -*-
import os
import winreg

# 레지스트리에서 setx로 등록한 새 키 읽기
with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
    new_key, _ = winreg.QueryValueEx(key, "GEMINI_API_KEY")

# 현재 프로세스의 키
old_key = os.environ.get("GEMINI_API_KEY", "")

print(f"현재 프로세스 키 끝4자: ...{old_key[-4:]}")
print(f"레지스트리 새 키 끝4자: ...{new_key[-4:]}")
print(f"키가 변경됨: {old_key != new_key}")

if old_key != new_key:
    print(f"\n새 키를 현재 프로세스에 적용합니다...")
    os.environ["GEMINI_API_KEY"] = new_key
    
    # 새 키로 테스트
    from google import genai
    client = genai.Client(api_key=new_key)
    try:
        resp = client.models.generate_content(model="gemini-2.5-flash", contents="Say hi")
        print(f"[SUCCESS] 새 키 작동 확인! 응답: {resp.text[:50]}")
    except Exception as e:
        print(f"[FAIL] 새 키도 실패: {e}")
else:
    print("\n키가 같습니다. 새 키를 발급받아 setx로 등록해주세요.")
