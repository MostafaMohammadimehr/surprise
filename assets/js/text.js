document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('backgroundMusic');
    const enableSoundBtn = document.getElementById('enableSound');
    
    // تنظیمات اولیه
    audio.volume = 0.7;
    
    // نمایش پیام به کاربر
    alert("باباجون ! لطفا صدا رو زیاد کن 😘♥️😍");
    
    // تلاش برای پخش خودکار با تأخیر
    setTimeout(function() {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('پخش خودکار متوقف شد: ممکن است نیاز به تعامل کاربر باشد.');
                // نمایش دکمه فعال‌سازی صدا
                enableSoundBtn.style.display = 'block';
            });
        }
    }, 1000);
    
    // مدیریت کلیک روی دکمه فعال‌سازی صدا
    enableSoundBtn.addEventListener('click', function() {
        audio.play()
            .then(() => {
                enableSoundBtn.style.display = 'none';
            })
            .catch(error => {
                console.error('خطا در پخش صدا:', error);
            });
    });
    
    // مخفی کردن دکمه در ابتدا
    enableSoundBtn.style.display = 'none';
});