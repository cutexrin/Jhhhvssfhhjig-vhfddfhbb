const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


function getLocation() {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        return config.location;
    } catch (error) {
        
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


app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Query:`, req.query);
    next();
});




app.get('/front/countrylist.php', (req, res) => {
    const loc = getLocation();
    console.log(`[CountryList] Serving location for ${loc.country_code}`);
    
    
    const response = {
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
    };
    res.json(response);
});


app.get('/countrylist', (req, res) => {
    const loc = getLocation();
    console.log(`[ShortConfigs] Fetch: ${req.query.fetch}`);
    
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


app.get('/getlang.php', (req, res) => {
    console.log(`[LanguageConfig] Country: ${req.query.country || 'N/A'}`);
    res.json({
        status: true,
        language: "en",
        translation_version: "1.0",
        data: {
            welcome: "Welcome to ZEE5",
            home: "Home",
            search: "Search",
            settings: "Settings"
        }
    });
});


app.get('/location', (req, res) => {
    res.json(getLocation());
});


app.post('/partner/api/silentregister.php', (req, res) => {
    res.json({ status: true, message: "Mock success" });
});
app.post('/device/sendotp_v1.php', (req, res) => {
    res.json({ status: true, message: "Mock OTP sent" });
});




app.post('/location/update', (req, res) => {
    const newLoc = req.body;
    if (!newLoc.country_code) {
        return res.status(400).json({ status: false, message: "Invalid location data" });
    }
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    config.location = newLoc;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('[Location Updated]', newLoc);
    res.json({ status: true, message: "Location updated!", location: newLoc });
});


app.post('/location/preset/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const presets = {
        'US': { country_code: "US", country: "UNITED STATES", state: "WASHINGTON", state_code: "WA", city: "SEATTLE", lat: 47.6109, long: -122.3303, pin: "98160" },
        'IN': { country_code: "IN", country: "INDIA", state: "MAHARASHTRA", state_code: "MH", city: "MUMBAI", lat: 19.0760, long: 72.8777, pin: "400001" },
        'BD': { country_code: "BD", country: "BANGLADESH", state: "DHAKA", state_code: "D", city: "DHAKA", lat: 23.8103, long: 90.4125, pin: "1000" },
        'UK': { country_code: "GB", country: "UNITED KINGDOM", state: "GREATER LONDON", state_code: "LDN", city: "LONDON", lat: 51.5074, long: -0.1278, pin: "SW1A 1AA" }
    };
    const preset = presets[code];
    if (!preset) {
        return res.status(404).json({ status: false, message: `Preset ${code} not found. Use US, IN, BD, UK` });
    }
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    config.location = { status: true, message: "success.!", ...preset };
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    res.json({ status: true, message: `Location set to ${code}`, location: config.location });
});


app.get('/', (req, res) => {
    res.json({
        status: true,
        message: "ZEE5 Location Proxy Server is Running!",
        current_location: getLocation(),
        endpoints: {
            countrylist: "/front/countrylist.php?lang=en&ccode=US",
            short_config: "/countrylist?fetch=short",
            language: "/getlang.php?country=US",
            location: "/location",
            update_location: "POST /location/update",
            preset: "POST /location/preset/US (US, IN, BD, UK)"
        }
    });
});


app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Current Location:`, getLocation());
});