const startTimer = (
  codeButton: HTMLButtonElement
) => {
  let seconds = 60;
  const timer = setInterval(() => {
    seconds--;
    codeButton.innerText = seconds + `秒后重试`;
    codeButton.disabled = true;
    if (!seconds) {
      clearInterval(timer);
      codeButton.innerText = '获取验证码';
      codeButton.disabled = false;
    }
  }, 1000);
}

export default startTimer;