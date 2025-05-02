// Mobil Menü
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Form gönderimi
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Mesajınız gönderildi! En kısa sürede size dönüş yapacağız.');
    this.reset();
});

// Sayfa yüklendiğinde animasyon
document.addEventListener('DOMContentLoaded', function() {
    const heroContent = document.querySelector('.hero-content');
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        heroContent.style.transition = 'opacity 1s ease, transform 1s ease';
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }, 100);

    // Kripto para fiyatlarını yükle
    loadCryptoPrices();
});

// Scroll olayında header'ı güncelle
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        header.style.backgroundColor = '#fff';
    }
});

// Kripto para fiyatlarını yükle
let previousPrices = {};
let retryCount = 0;
const MAX_RETRIES = 3;

async function loadCryptoPrices() {
    try {
        // API isteği için timeout ekle
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye timeout

        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,bnb,solana,cardano&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true&include_market_cap=true&include_total_volume=true',
            {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Piyasa verilerini güncelle
        const totalMarketCap = Object.values(data).reduce((sum, coin) => sum + (coin.usd_market_cap || 0), 0);
        const totalVolume = Object.values(data).reduce((sum, coin) => sum + (coin.usd_24h_vol || 0), 0);
        
        document.getElementById('total-market-cap').textContent = `$${(totalMarketCap / 1e9).toFixed(2)}B`;
        document.getElementById('total-volume').textContent = `$${(totalVolume / 1e9).toFixed(2)}B`;
        
        // Her coin için fiyat bilgilerini güncelle
        updatePrice('btc', data.bitcoin);
        updatePrice('eth', data.ethereum);
        updatePrice('bnb', data.bnb);
        updatePrice('sol', data.solana);
        updatePrice('ada', data.cardano);

        // Başarılı güncelleme sonrası retry sayacını sıfırla
        retryCount = 0;

        // Son güncelleme zamanını güncelle
        const now = new Date();
        document.getElementById('last-update-time').textContent = 
            now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    } catch (error) {
        console.error('Kripto para fiyatları yüklenirken hata oluştu:', error);
        
        // Hata mesajını göster
        showError();
        
        // Retry mekanizması
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Yeniden deneme ${retryCount}/${MAX_RETRIES}`);
            setTimeout(loadCryptoPrices, 5000); // 5 saniye sonra tekrar dene
        }
    }
}

function showError() {
    const coins = ['btc', 'eth', 'bnb', 'sol', 'ada'];
    coins.forEach(coin => {
        const priceElement = document.getElementById(`${coin}-price`);
        const changeElement = document.getElementById(`${coin}-change`);
        const highElement = document.getElementById(`${coin}-high`);
        const lowElement = document.getElementById(`${coin}-low`);
        
        if (priceElement) priceElement.textContent = 'Yükleniyor...';
        if (changeElement) changeElement.textContent = '%0.00';
        if (highElement) highElement.textContent = '$0.00';
        if (lowElement) lowElement.textContent = '$0.00';
    });
}

function updatePrice(coin, data) {
    if (!data) return;

    const priceElement = document.getElementById(`${coin}-price`);
    const changeElement = document.getElementById(`${coin}-change`);
    const highElement = document.getElementById(`${coin}-high`);
    const lowElement = document.getElementById(`${coin}-low`);
    
    if (!priceElement || !changeElement || !highElement || !lowElement) return;
    
    // Fiyat değişimini hesapla
    const currentPrice = data.usd;
    const previousPrice = previousPrices[coin] || currentPrice;
    
    // Fiyatı güncelle
    priceElement.textContent = `$${currentPrice.toLocaleString()}`;
    
    // 24 saatlik değişimi güncelle
    const change24h = data.usd_24h_change || 0;
    changeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    
    // 24 saatlik en yüksek ve en düşük değerleri güncelle
    highElement.textContent = `$${(data.usd_24h_high || currentPrice).toLocaleString()}`;
    lowElement.textContent = `$${(data.usd_24h_low || currentPrice).toLocaleString()}`;
    
    // Değişim rengini güncelle
    changeElement.className = 'price-change ' + (change24h >= 0 ? 'positive' : 'negative');
    
    // Fiyat değişim animasyonu
    if (previousPrices[coin]) {
        priceElement.style.transition = 'color 0.5s ease';
        if (currentPrice > previousPrice) {
            priceElement.style.color = '#2ed573';
        } else if (currentPrice < previousPrice) {
            priceElement.style.color = '#ff4757';
        }
        setTimeout(() => {
            priceElement.style.color = 'white';
        }, 500);
    }
    
    // Önceki fiyatı kaydet
    previousPrices[coin] = currentPrice;
}

// Sayfa yüklendiğinde fiyatları yükle
document.addEventListener('DOMContentLoaded', function() {
    loadCryptoPrices();
    
    // Her 30 saniyede bir fiyatları güncelle
    setInterval(loadCryptoPrices, 30000);
}); 