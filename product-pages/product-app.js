(async function() {
    // 1. הגדרות חיבור למאגר ח. סבן
    const SB_URL = 'https://sqslrnbduxtxsvwqryxq.supabase.co';
    const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxc2xybmJkdXh0eHN2d3FyeXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzQyMjUsImV4cCI6MjA4NzA1MDIyNX0.iws40NwGg2clY3SqwAsm656X_VrESsrNkR-dfOQ7Eh8';

    // 2. שליפת ה-ID מהכתובת (URL)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:50px;'>שגיאה: לא נבחר מוצר</h1>";
        return;
    }

    // 3. פונקציה למשיכת נתונים מ-Supabase
    async function getProduct(id) {
        try {
            const response = await fetch(`${SB_URL}/rest/v1/inventory?sku=eq.${id}&select=*`, {
                headers: {
                    'apikey': SB_KEY,
                    'Authorization': `Bearer ${SB_KEY}`
                }
            });
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error("שגיאה במשיכת נתונים:", error);
            return null;
        }
    }

    const P = await getProduct(productId);

    if (!P) {
        document.body.innerHTML = `<h1 style='color:white; text-align:center; margin-top:50px;'>המוצר (מק"ט ${productId}) לא נמצא במלאי</h1>`;
        return;
    }

    // 4. עדכון התצוגה בדף עם הנתונים האמיתיים
    document.title = `ח. סבן | ${P.product_name}`;
    document.querySelector('h1').innerText = P.product_name;
    document.querySelector('.text-emerald-500').innerText = P.category || "חומרי בניין";
    
    // עדכון מחיר אם קיים
    if (P.price) {
        const priceTag = document.createElement('div');
        priceTag.className = "text-2xl font-black text-white mt-2";
        priceTag.innerText = `₪${P.price}`;
        document.querySelector('h1').after(priceTag);
    }

    // 5. הפעלת המחשבון עם נתוני הצריכה מהטבלה
    const areaInput = document.getElementById('calc-area');
    const thickInput = document.getElementById('calc-thick');
    const resDiv = document.getElementById('calc-result');

    function calculate() {
        const area = parseFloat(areaInput.value) || 0;
        const thick = parseFloat(thickInput.value) || 0;
        // לוקח צריכה מהטבלה או ברירת מחדל 1.6
        const consumption = P.consumption_per_mm || 1.6; 
        const totalKg = area * thick * consumption * 1.1; // 10% פחת
        const bags = Math.ceil(totalKg / (P.packaging_size || 25));
        resDiv.innerText = `סה"כ נדרש: ${bags} שקים (${P.packaging_size || 25} ק"ג)`;
    }

    [areaInput, thickInput].forEach(i => i.addEventListener('input', calculate));
    calculate();

    // עדכון תמונה אם קיימת עמודת image_url בטבלה
    if (P.image_url) {
        document.querySelector('#main-media img').src = P.image_url;
    }

})();
