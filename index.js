const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ======================== লোকেশন লোড ========================

function getLocation() {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        return config.location;
    } catch (error) {
        // config.json না থাকলে ডিফল্ট লোকেশন
        return {
            status: true,
            message: "success.!",
            country_code: "US",
            country: "UNITED STATES",
            state: "WASHINGTON",
            state_code: "WA",
            city: "SEATTLE",
            lat: 47.6109,
            long: -122.3303,
            pin: "98160"
        };
    }
}

// প্রিসেট লোকেশন (দ্রুত স্যুইচের জন্য)
function getPreset(code) {
    const presets = {
        'US': { status: true, message: "success.!", country_code: "US", country: "UNITED STATES", state: "WASHINGTON", state_code: "WA", city: "SEATTLE", lat: 47.6109, long: -122.3303, pin: "98160" },
        'IN': { status: true, message: "success.!", country_code: "IN", country: "INDIA", state: "MAHARASHTRA", state_code: "MH", city: "MUMBAI", lat: 19.0760, long: 72.8777, pin: "400001" },
        'BD': { status: true, message: "success.!", country_code: "BD", country: "BANGLADESH", state: "DHAKA", state_code: "D", city: "DHAKA", lat: 23.8103, long: 90.4125, pin: "1000" },
        'UK': { status: true, message: "success.!", country_code: "GB", country: "UNITED KINGDOM", state: "GREATER LONDON", state_code: "LDN", city: "LONDON", lat: 51.5074, long: -0.1278, pin: "SW1A 1AA" },
        'CA': { status: true, message: "success.!", country_code: "CA", country: "CANADA", state: "ONTARIO", state_code: "ON", city: "TORONTO", lat: 43.6532, long: -79.3832, pin: "M5V 2T6" },
        'AU': { status: true, message: "success.!", country_code: "AU", country: "AUSTRALIA", state: "NEW SOUTH WALES", state_code: "NSW", city: "SYDNEY", lat: -33.8688, long: 151.2093, pin: "2000" }
    };
    return presets[code] || null;
}

// ======================== লগিং (ডিবাগের জন্য) ========================

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Query:`, req.query);
    next();
});

// ======================== লোকেশন API ========================

// 1. /country (ZEE5 অ্যাপ সরাসরি এই এন্ডপয়েন্ট কল করে)
app.get('/country', (req, res) => {
    const loc = getLocation();
    const { lang, ccode } = req.query;
    console.log(`[Country] lang=${lang}, ccode=${ccode}`);
    
    // যদি ccode পাঠানো হয়, সেটার প্রিসেট রিটার্ন করি
    if (ccode) {
        const preset = getPreset(ccode.toUpperCase());
        if (preset) {
            return res.json(preset);
        }
    }
    res.json(loc);
});

// 2. কান্ট্রি লিস্ট কনফিগ (B2BApi.smali -> getCountryListConfig)
app.get('/front/countrylist.php', (req, res) => {
    const loc = getLocation();
    const { lang, ccode, version } = req.query;
    console.log(`[CountryList] lang=${lang}, ccode=${ccode}, version=${version}`);
    
    res.json({
        status: true,
        data: [{
            country_code: loc.country_code,
            country_name: loc.country,
            state: loc.state,
            state_code: loc.state_code,
            city: loc.city,
            lat: loc.lat,
            long: loc.long,
            pin: loc.pin
        }]
    });
});

// 3. শর্ট কনফিগ (t.smali -> getShortConfigs)
app.get('/countrylist', (req, res) => {
    const loc = getLocation();
    console.log(`[ShortConfigs] fetch=${req.query.fetch}`);
    
    if (req.query.fetch === 'short') {
        res.json({
            status: true,
            data: [{
                country_code: loc.country_code,
                country_name: loc.country,
                state_code: loc.state_code,
                state: loc.state
            }]
        });
    } else {
        res.json(loc);
    }
});

// 4. ভাষা কনফিগ (B2BApi.smali -> getLanguageConfigAsString)
app.get('/getlang.php', (req, res) => {
    const { country, state, translation, version } = req.query;
    console.log(`[LanguageConfig] country=${country}, state=${state}`);
    
    res.json({
        status: true,
        language: "en",
        translation_version: version || "1.0",
        data: {
            welcome: "Welcome to ZEE5",
            home: "Home",
            search: "Search",
            settings: "Settings",
            profile: "Profile"
        }
    });
});

// 5. কান্ট্রি সিলেক্টর ডেটা (B2BApi.smali -> getCountryListSelectorData)
app.get('/front/countrylist.php', (req, res) => {
    const loc = getLocation();
    res.json([{
        country_code: loc.country_code,
        country_name: loc.country,
        state: loc.state,
        state_code: loc.state_code,
        city: loc.city
    }]);
});

// 6. লোকেশন ডিরেক্ট চেক
app.get('/location', (req, res) => {
    res.json(getLocation());
});

// 7. সাইলেন্ট রেজিস্ট্রেশন (অন্যান্য API)
app.post('/partner/api/silentregister.php', (req, res) => {
    res.json({ status: true, message: "Mock success" });
});

app.post('/device/sendotp_v1.php', (req, res) => {
    res.json({ status: true, message: "Mock OTP sent" });
});

app.post('/device/verifyotp_v1.php', (req, res) => {
    res.json({ status: true, message: "OTP verified" });
});

// ======================== লোকেশন আপডেট API ========================

// 8. লোকেশন আপডেট (POST) - নতুন JSON পাঠালে config.json আপডেট হবে
app.post('/location/update', (req, res) => {
    const newLoc = req.body;
    if (!newLoc.country_code) {
        return res.status(400).json({ 
            status: false, 
            message: "Invalid location data. Need country_code" 
        });
    }
    
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        config.location = newLoc;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        console.log('[Location Updated]', newLoc);
        res.json({ 
            status: true, 
            message: "Location updated successfully!", 
            location: newLoc 
        });
    } catch (error) {
        res.status(500).json({ 
            status: false, 
            message: "Failed to update location" 
        });
    }
});

// 9. প্রিসেট লোকেশন সেট (দ্রুত স্যুইচ)
app.post('/location/preset/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const preset = getPreset(code);
    
    if (!preset) {
        return res.status(404).json({ 
            status: false, 
            message: `Preset "${code}" not found. Use: US, IN, BD, UK, CA, AU` 
        });
    }
    
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        config.location = { status: true, message: "success.!", ...preset };
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        console.log(`[Preset Applied] ${code}`, config.location);
        res.json({ 
            status: true, 
            message: `Location set to ${code}`, 
            location: config.location 
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Failed to apply preset" });
    }
});

// ======================== হোম পেজ ========================

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: "ZEE5 Location Proxy Server is Running!",
        current_location: getLocation(),
        endpoints: {
            country: "/country",
            countrylist: "/front/countrylist.php?lang=en&ccode=US",
            short_config: "/countrylist?fetch=short",
            language: "/getlang.php?country=US&state=WA",
            location: "/location",
            update_location: "POST /location/update",
            preset: "POST /location/preset/US (US, IN, BD, UK, CA, AU)"
        }
    });
});

// ======================== সার্ভার চালু ========================

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Current Location:`, getLocation());
});