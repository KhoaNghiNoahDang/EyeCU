import codecs
import re

with codecs.open('src/routes/login.tsx', 'r', 'utf-8') as f:
    content = f.read()

old_handle_login = '''  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^\d{12}$/.test(cccd.trim())) {
      setFormError("Số CCCD phải gồm 12 chữ số");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }

    const found = findPatientByCccdAndPhone(cccd, phone);
    if (!found) {
      setFormError("Chưa tìm thấy tài khoản. Vui lòng đăng ký trước.");
      return;
    }

    if (!found.credentialId) {
      setPendingPatient(found);
      setStep("no_credential");
      return;
    }

    setPendingPatient(found);
    setStep("face");
  };'''

new_handle_login = '''  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^\d{12}$/.test(cccd.trim())) {
      setFormError("Số CCCD phải gồm 12 chữ số");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }

    try {
      const res = await fetchApi(`/patient/lookup?cccd=${cccd}&phone=${phone}`);
      if (!res) throw new Error("Not found");
      
      const localFound = findPatientByCccdAndPhone(cccd, phone);
      const pending: RegisteredPatient = {
        cccd: res.cccd,
        name: res.name,
        phone: res.phone || phone,
        bhxh_code: res.bhxh_code,
        avatar_url: res.avatar_url,
        credentialId: localFound?.credentialId,
      };

      setPendingPatient(pending);

      if (!pending.credentialId) {
        setStep("no_credential");
        return;
      }

      setStep("face");
    } catch (err: any) {
      setFormError("Chưa tìm thấy tài khoản. Vui lòng kiểm tra lại thông tin hoặc đăng ký mới.");
    }
  };'''

content = content.replace(old_handle_login, new_handle_login)

with codecs.open('src/routes/login.tsx', 'w', 'utf-8') as f:
    f.write(content)
