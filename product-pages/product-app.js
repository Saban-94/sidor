// product-app.js - חיבור למאגר ח. סבן
const SB_URL = 'https://sqslrnbduxtxsvwqryxq.supabase.co'; 
const SB_KEY = 'YOUR_SUPABASE_ANON_KEY'; // שים כאן את ה-anon/public key שלך

async function fetchProductData(productId) {
    try {
        const res = await fetch(`${SB_URL}/rest/v1/inventory?sku=eq.${productId}&select=*`, {
            headers: { 
                'apikey': SB_KEY, 
                'Authorization': `Bearer ${SB_KEY}` 
            }
        });
        const data = await res.json();
        return data[0];
    } catch (err) {
        console.error("שגיאה במשיכת נתונים מהמלאי:", err);
        return null;
    }
}
(function() {
    const product = {
        id: "termokir_603",
        consumption: 1.6, // ק"ג למ"ר לכל 1 מ"מ עובי
        packSize: 25
    };

    // 1. מחשבון כמויות
    const areaInput = document.getElementById('calc-area');
    const thickInput = document.getElementById('calc-thick');
    const resDiv = document.getElementById('calc-result');

    function calculate() {
        const area = parseFloat(areaInput.value) || 0;
        const thick = parseFloat(thickInput.value) || 0;
        const totalKg = area * thick * product.consumption * 1.1; // 10% פחת
        const bags = Math.ceil(totalKg / product.packSize);
        resDiv.innerText = `סה"כ נדרש: ${bags} שקים (25 ק"ג)`;
    }

    [areaInput, thickInput].forEach(i => i.addEventListener('input', calculate));

    // 2. רינדור מוצרים משלימים (Bundles)
    const bundles = [
        { name: "פריימר מקשר", price: "120₪", img: "https://via.placeholder.com/100" },
        { name: "מאלג' שיניים 10 מ"מ", price: "45₪", img: "https://via.placeholder.com/100" }
    ];

    const grid = document.getElementById('bundle-grid');
    bundles.forEach(item => {
        grid.innerHTML += `
            <div class="glass-card p-4 rounded-3xl text-center space-y-2">
                <img src="${item.img}" class="w-16 h-16 mx-auto rounded-xl">
                <div class="text-xs font-bold">${item.name}</div>
                <div class="text-[10px] text-emerald-500 font-black">${item.price}</div>
                <button class="interactive w-full bg-white/5 py-2 rounded-lg text-[10px] font-bold">+ הוסף</button>
            </div>
        `;
    });
})();
