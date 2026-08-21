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
            country_code: "IN",
            country: "INDIA",
            state: "WEST BENGAL",
            state_code: "WB",
            city: "BAHARAMPUR",
            lat: 24.1024,
            long: 88.2508,
            pin: "742103"
        };
    }
}



app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Query:`, req.query);
    next();
});


app.get('/country', (req, res) => {
    const loc = getLocation();
    console.log(`[Country] Serving location: ${loc.country_code} - ${loc.city}`);
    res.json(loc);
});


app.get('/front/countrylist.php', (req, res) => {
    const loc = getLocation();
    console.log(`[CountryList] lang=${req.query.lang}, ccode=${req.query.ccode}`);
    
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


app.get('/countrylist', (req, res) => {
    const loc = getLocation();
    
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
    console.log(`[LanguageConfig] country=${req.query.country}`);
    res.json({
        status: true,
        language: "en",
        translation_version: "1.0",
        data: {
            welcome: "Welcome to ZEE5",
            home: "Home",
            search: "Search",
            settings: "Settings",
            profile: "Profile"
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

app.post('/device/verifyotp_v1.php', (req, res) => {
    res.json({ status: true, message: "OTP verified" });
});



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



app.get('/', (req, res) => {
    res.json({
        status: true,
        message: "ZEE5 Location Proxy Server is Running!",
        current_location: getLocation(),
        endpoints: {
            country: "/country",
            countrylist: "/front/countrylist.php?lang=en&ccode=IN",
            short_config: "/countrylist?fetch=short",
            language: "/getlang.php?country=IN",
            location: "/location",
            update_location: "POST /location/update"
        }
    });
});



app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Current Location:`, getLocation());
});