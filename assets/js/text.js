alert("باباجون ! لطفا صدا رو زیاد کن 😘♥️😍");

document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('backgroundMusic');
    
    // تنظیمات اولیه
    audio.volume = 0.7;
    
    // تلاش برای پخش خودکار با تأخیر
    setTimeout(function() {
        audio.play().catch(error => {
            console.log('پخش خودکار متوقف شد: ممکن است نیاز به تعامل کاربر باشد.');
        });
    }, 0);
});