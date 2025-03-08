// File: backend/app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const Fivem = require("fivem-server-api");
const axios = require("axios");
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('connect-mysql')(session);
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fileUpload = require('express-fileupload');
const crypto = require('crypto');  // For generating random invite code
var Cookies = require('cookies')
const { v4: uuidv4 } = require('uuid'); // For generating unique invite codes
const fs = require('fs');
const path = require('path');
const paypal = require('paypal-rest-sdk');
const { URL } = require('url');
const jwt = require('jsonwebtoken');

function createAuthToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    discord_id: user.discord_id,
  };

  const secretKey = process.env.JWT_SECRET_KEY; // Use a secure secret for signing the token
  const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Set expiration as needed
  return token;
}


require('dotenv').config();
const sanitizeInput = (input) => {
  return input.replace(/[^\w@.-]/g, ''); // Remove everything except letters, numbers, @, ., and -
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

paypal.configure({
  'mode': 'sandbox', // Change to 'live' for production
  'client_id': PAYPAL_CLIENT_ID,
  'client_secret': PAYPAL_CLIENT_SECRET
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(fileUpload());


// Session Middleware
const options = {
  config: {
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
    port: process.env.DBPORT || 3306,
  },
};

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(options), // Use connect-mysql with options
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Database Connection
const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  database: process.env.DBNAME,
  port: process.env.DBPORT || 3306,
});



// Helper function to fetch FiveM server details
async function fetchServerDetails(ip) {
  // 1. Query the database for stored values
  let dbData = {};
  try {
    const [rows] = await pool.query(
      "SELECT * FROM servers WHERE ip = ? LIMIT 1",
      [ip]
    );
    
    if (rows.length > 0) {
      dbData = rows[0];
      
      // Convert database tags to a comma-separated string
      if (dbData.serverTags) {
        try {
          const parsedTags = JSON.parse(dbData.serverTags);
          dbData.serverTags = Array.isArray(parsedTags) ? parsedTags.join(',') : dbData.serverTags;
        } catch (e) {
          // If not JSON, ensure it's a string
          dbData.serverTags = typeof dbData.serverTags === 'string' ?
            dbData.serverTags :
            '';
        }
      } else {
        dbData.serverTags = ''; // Default to empty string
      }
    }
  } catch (dbErr) {
    console.error("Database error:", dbErr);
  }

  // 2. Get fallback values from info.json
  let apiFallback = {};
  try {
    const { data } = await axios.get(`http://${ip}/info.json`, { timeout: 20000 });
    apiFallback.banner = data.vars.banner_connecting || null;
    apiFallback.serverDiscord = data.vars.Discord || null;
    apiFallback.citySecret = data.vars.citySecret || null;
  } catch (err) {
    console.error("Info.json fallback error:", err);
  }

  // 3. Get dynamic data via Fivem.Server
  const server = new Fivem.Server(ip, { timeout: 10000 });
  let dynamicData = {};
  
  try {
    const [
      status,
      players,
      maxPlayers,
      serverName,
      GameBuild,
      apiServerDesc,
      apiServerTags
    ] = await Promise.all([
      server.getServerStatus(),
      server.getPlayers(),
      server.getMaxPlayers(),
      server.getServerName(),
      server.getGameBuild(),
      server.getServerDesc(),
      server.getTags(),
    ]);

    // Process API tags into a comma-separated string
    let processedApiTags = '';
    if (Array.isArray(apiServerTags)) {
      processedApiTags = apiServerTags.join(',');
    } else if (typeof apiServerTags === 'string') {
      processedApiTags = apiServerTags;
    }

    // Combine all tag sources
    const combinedTags = [
      ...(dbData.serverTags ? dbData.serverTags.split(',') : []),
      ...(processedApiTags ? processedApiTags.split(',') : [])
    ];

    // Remove duplicates and convert back to a comma-separated string
    const uniqueTags = [...new Set(combinedTags)].join(',');

    dynamicData = {
      status: status.online,
      players,
      maxPlayers,
      serverName,
      GameBuild,
      serverDesc: dbData.description || apiServerDesc || null,
      serverTags: uniqueTags, // Now always a comma-separated string
      citySecret: apiFallback.citySecret
    };
  } catch (err) {
    console.error("Dynamic data error:", err);
    return {
      status: false,
      players: 0,
      maxPlayers: 0,
      serverName: 'Unavailable'
    };
  }

  // 4. Combine all data sources
  return {
    status: dynamicData.status,
    players: dynamicData.players,
    maxPlayers: dynamicData.maxPlayers,
    serverName: dynamicData.serverName,
    GameBuild: dynamicData.GameBuild,
    serverDesc: dynamicData.serverDesc,
    serverTags: dynamicData.serverTags, // Always a comma-separated string
    banner: dbData.pbanner || apiFallback.banner || null,
    serverDiscord: dbData.discord_server || apiFallback.serverDiscord || null,
    citySecret: dynamicData.citySecret
  };
}
  

// Discord Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENTID, 
      clientSecret: process.env.DISCORD_SECRET,
      callbackURL: `${process.env.WEB_HOST}`,
      scope: ['identify', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const cookies = new Cookies(req, req.res); 
        const userIdFromCookies = cookies.get('userid'); // ✅ Now this will work
        console.log(userIdFromCookies)
        const { id: discord_id, username, email, avatar } = profile;
        const avatarUrl = avatar
          ? `https://cdn.discordapp.com/avatars/${discord_id}/${avatar}.${avatar.startsWith('a_') ? 'gif' : 'png'}`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.discriminator) % 5}.png`;

        // Check if user already exists with Discord ID
        const [existingUser] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [discord_id]);

        if (existingUser.length > 0) {
          // User exists, update their avatar
          const user = existingUser[0];
          await pool.query('UPDATE users SET avatar = ? WHERE discord_id = ?', [avatarUrl, discord_id]);
          return done(null, user);
        }

        return done();
      } catch (err) {
        console.error('Error in Discord strategy:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  done(null, rows.length > 0 ? rows[0] : null);
});
    
app.use(passport.initialize());
app.use(passport.session());

app.use(async (req, res, next) => {
  try {
    // Fetch ads from the database
    const [a_ads] = await pool.execute("SELECT * FROM ads WHERE section = 'a'");
    const [b_ads] = await pool.execute("SELECT * FROM ads WHERE section = 'b'");
    const [c_ads] = await pool.execute("SELECT * FROM ads WHERE section = 'c'");

    

    // Merge static ads with database ads
    res.locals.ads = {
      a: [ ...a_ads],
      b: [ ...b_ads],
      c: [ ...c_ads]
    };

    const cookies = new Cookies(req, res);
    res.locals.cookies = cookies;
    // Check if the user has already accepted the cookie policy
    if (cookies.get('cookieConsent')) {
      return next(); // Proceed if cookies are accepted
    }

    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Error fetching ads:", error);
    next();
  }
});

app.use(async (req, res, next) => {
  try {
    // Check if the site is in maintenance mode
    const isMaintenanceMode = process.env.MAINTENANCE_MODE;
    res.locals.isMaintenanceMode = isMaintenanceMode;
    if (isMaintenanceMode == true && req.path !== '/landing') {
      const userIp = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress;

      console.log("user ip:",userIp);


      // Query the database to check if the IP is whitelisted
      const [rows] = await pool.query('SELECT * FROM admin_whitelist WHERE ip_address = ?', [userIp]);

      if (rows.length === 0) {
        // If the IP is not whitelisted, redirect to a maintenance page
        return res.redirect('/landing'); // Replace with the actual maintenance landing page route
      }
    }

    // If maintenance mode is not active or the IP is whitelisted, proceed
    next();
  } catch (err) {
    console.error('Error checking maintenance mode or IP whitelist:', err);
    res.status(500).send('Internal server error');
  }
});

app.get('/', async (req, res) => {
  try {
    res.render('index', {session: req.session})
  } catch (err) {
    console.error('Error:', err);
  }
});

app.get('/ad/impression/:id', async (req, res) => {
  try {
    const adId = req.params.id;
    await pool.execute('UPDATE ads SET impressions = impressions + 1 WHERE id = ?', [adId]);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating impression:', error);
    res.sendStatus(500);
  }
});

app.get('/ad/click/:id', async (req, res) => {
  try {
    const adId = req.params.id;
    // Increment the clicks counter
    await pool.execute('UPDATE ads SET clicks = clicks + 1 WHERE id = ?', [adId]);
    // Retrieve the ad's link so we can redirect the user
    const [rows] = await pool.execute('SELECT link FROM ads WHERE id = ?', [adId]);
    if (rows.length > 0) {
      res.redirect(rows[0].link);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error updating click:', error);
    res.sendStatus(500);
  }
});

app.post('/set-cookie-consent', (req, res) => {
  const cookies = new Cookies(req, res);
  
  // Set the cookie
  cookies.set('cookieConsent', 'true', { httpOnly: false, maxAge: 60 * 60 * 24 * 365 * 1000 }); // 1 year expiration
  
  // Respond with a status
  res.status(200).send('Cookie consent accepted');
});



async function getReferrerInvite(userId) {
    try {
        // Query the users table to get the referrer ID for the user
        const userResult = await pool.query('SELECT referrer FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            console.log('User not found!');
            return null;
        }

        const referrerId = userResult.rows[0].referrer;

        // If there's no referrer, return null or handle accordingly
        if (!referrerId) {
            console.log('No referrer found for this user');
            return null;
        }

        // Query the users table to get the invite data for the referrer
        const referrerResult = await pool.query('SELECT invite FROM users WHERE id = $1', [referrerId]);

        if (referrerResult.rows.length === 0) {
            console.log('Referrer not found!');
            return null;
        }

        // Return the invite (referral code) of the referrer
        return referrerResult.rows[0].invite;
    } catch (error) {
        console.error('Error fetching referrer invite:', error);
        return null;
    }
}

app.get('/validate-discount', async (req, res) => {
  const { discountCode } = req.query;
  console.log(discountCode)
  if (!discountCode) {
    return res.json({ valid: false }); // No discount code provided
  }

  try {
    // Query the database to check if the discount code exists and is valid
    const [discount] = await pool.query(
      `SELECT * FROM contractor_discount_codes 
       WHERE code = ? AND is_active = 1 
       AND (expiry_date IS NULL OR expiry_date > NOW())`,
      [discountCode]
    );

    // Check if a valid discount code is found
    if (discount.length > 0) {
      return res.json({ valid: true });
    } else {
      return res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error validating discount code:', error);
    return res.status(500).send('Server error');
  }
});

app.get('/privacy-policy', async (req,res) => {
  res.render('privacy', {session: req.session})
})

app.get('/terms-conditions', async (req,res) => {
  res.render('terms', {session: req.session})
})

// Admin Settings Route - Manage Categories, Achievements, and Quests
app.get('/admin/settings', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const [categories] = await pool.query("SELECT * FROM categories");
      const [achievements] = await pool.query("SELECT * FROM achievements");
      const [quests] = await pool.query("SELECT * FROM quests");

      res.render('a-settings', {
          categories,
          achievements,
          quests,
          session: req.session
      });
  } catch (error) {
      console.error("Error fetching admin settings data:", error);
      res.status(500).send("Internal Server Error");
  }
});

app.get('/admin/sponsors', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Fetch all sponsor requests, ordered by creation date descending
    const [requests] = await pool.query('SELECT * FROM sponsor_requests ORDER BY created_at DESC');
    
    // Render the admin template and pass the session and sponsor requests to it
    res.render('a-sponsor', {
      session: req.session,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching sponsor requests:', error);
    res.status(500).send('Server Error');
  }
});

// Accept sponsor request route
app.get('/admin/accept-sponsor/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const sponsorId = req.params.id;
    
    // Retrieve the sponsor's email and name from the request
    const [requestRows] = await pool.query('SELECT email, name FROM sponsor_requests WHERE id = ?', [sponsorId]);
    if (requestRows.length === 0) {
      return res.status(404).send("Sponsor request not found.");
    }
    
    const { email, name } = requestRows[0];

    // Generate a random password
    const plainPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert the accepted sponsor into the sponsors table
    await pool.query('INSERT INTO sponsors (email, name, password) VALUES (?, ?, ?)', [email, name, hashedPassword]);

    // Delete the request from the sponsor_requests table
    await pool.query('DELETE FROM sponsor_requests WHERE id = ?', [sponsorId]);

    // Log or display the password for the admin to give to the sponsor manually
    console.log(`Sponsor accepted: ${name} - ${email}`);
    console.log(`Generated password: ${plainPassword}`);

    res.redirect('/admin/sponsors');
  } catch (error) {
    console.error("Error accepting sponsor request:", error);
    res.status(500).send("Server error while accepting sponsor request.");
  }
});

// Deny sponsor request route
app.get('/admin/deny-sponsor/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const sponsorId = req.params.id;
    // Update the sponsor_requests table to mark this request as denied
    await pool.query('UPDATE sponsor_requests SET status = ? WHERE id = ?', ['denied', sponsorId]);
    // Redirect back to the admin sponsors page
    res.redirect('/admin/sponsors');
  } catch (error) {
    console.error("Error denying sponsor request:", error);
    res.status(500).send("Server error while denying sponsor request.");
  }
});

// Add Category
app.post('/admin/add-category', isAuthenticated, isAdmin, async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) return res.redirect('/admin/settings');

  try {
      await pool.query("INSERT INTO categories (name) VALUES (?)", [categoryName]);
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).send("Internal Server Error");
  }
});

// Delete Category
app.post('/admin/delete-category/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
      await pool.query("DELETE FROM categories WHERE id = ?", [id]);
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).send("Internal Server Error");
  }
});

app.get('/admin/get-category', isAuthenticated, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 5;
  const offset = (page - 1) * perPage;

  const [items] = await pool.query("SELECT * FROM categories LIMIT ? OFFSET ?", [perPage, offset]);
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM categories");

  res.json({ items, page, perPage, totalPages: Math.ceil(total / perPage) });
});

app.get('/admin/get-achievement', isAuthenticated, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const offset = (page - 1) * perPage;

  const [items] = await pool.query("SELECT * FROM achievements LIMIT ? OFFSET ?", [perPage, offset]);
  const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM achievements");

  res.json({ items, page, perPage, totalPages: Math.ceil(total / perPage) });
});


// Add Achievement
app.post('/admin/add-achievement', isAuthenticated, isAdmin, async (req, res) => {
  const { achievementName, description } = req.body;
  if (!achievementName) return res.redirect('/admin/settings');

  try {
      await pool.query("INSERT INTO achievements (name, description) VALUES (?, ?)", [achievementName, description]);
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error adding achievement:", error);
      res.status(500).send("Internal Server Error");
  }
});

app.get('/admin/get-quest', isAuthenticated, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const offset = (page - 1) * perPage;

  try {
      const [items] = await pool.query("SELECT * FROM quests LIMIT ? OFFSET ?", [perPage, offset]);
      const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM quests");

      res.json({ items, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
      console.error("Error fetching quests:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});


// Delete Achievement
app.post('/admin/delete-achievement/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
      await pool.query("DELETE FROM achievements WHERE id = ?", [id]);
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error deleting achievement:", error);
      res.status(500).send("Internal Server Error");
  }
});

app.get('/admin/edit-quest/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params; // Get the quest ID from URL

  try {
      const [quests] = await pool.query("SELECT * FROM quests WHERE id = ?", [id]);
      if (quests.length === 0) {
          return res.status(404).send("Quest not found");
      }

      res.render('edit-quest', { quest: quests[0] }); // Render edit page with quest details
  } catch (error) {
      console.error("Error fetching quest:", error);
      res.status(500).send("Internal Server Error");
  }
});

app.post('/admin/edit-quest/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { questName, objectives, numberRequired, reward } = req.body;

  if (!questName || !objectives || !numberRequired || !reward) {
      return res.redirect(`/admin/edit-quest/${id}`);
  }

  // Update the description based on objectives + required count
  const description = `Complete ${numberRequired} ${objectives.replace(/_/g, ' ')} task(s)`;

  try {
      await pool.query(
          "UPDATE quests SET name = ?, description = ?, reward_xp = ?, required_count = ? WHERE id = ?",
          [questName, description, reward, numberRequired, id]
      );
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error updating quest:", error);
      res.status(500).send("Internal Server Error");
  }
});



// Add Quest
app.post('/admin/add-quest', isAuthenticated, isAdmin, async (req, res) => {
  const { questName, objectives, numberRequired, reward } = req.body;
  
  // Ensure required fields are present
  if (!questName || !objectives || !numberRequired || !reward) {
      return res.redirect('/admin/settings');
  }

  // Create the description based on the selected objective and required count
  const description = `Complete ${numberRequired} ${objectives.replace(/_/g, ' ')} task(s)`;

  try {
      await pool.query(
          "INSERT INTO quests (name, description, reward_xp, required_count) VALUES (?, ?, ?, ?)", 
          [questName, description, reward, numberRequired]
      );
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error adding quest:", error);
      res.status(500).send("Internal Server Error");
  }
});


// Delete Quest
app.post('/admin/delete-quest/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
      await pool.query("DELETE FROM quests WHERE id = ?", [id]);
      res.redirect('/admin/settings');
  } catch (error) {
      console.error("Error deleting quest:", error);
      res.status(500).send("Internal Server Error");
  }
});



app.post('/admin/feature-city', async (req, res) => {
  const { city, tier } = req.body;
  let duration = parseInt(req.body.duration) || 30; // Default to 30 days if not provided
  try {
    // Calculate the expiration date by adding the duration (in days) to the current date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(duration, 10)); // Convert duration to integer

    // Insert the city into the featured_cities table with expiration_date
    await pool.query(
      `INSERT INTO featured_cities (server_id, tier, expiration_date) 
       VALUES (?, ?, ?)`,
      [city, tier, expirationDate]
    );

    // Redirect or render a success message
    res.redirect('/admin');
  } catch (err) {
    console.error('Error featuring city:', err);
    res.status(500).send('Error featuring city');
  }
});

app.post('/admin/add-banner', async (req, res) => {
  try {
      const { imgUrl, redirectUrl, openInTab, 'banner-section': section } = req.body;
      const uploadedFile = req.files ? req.files.imgUpload : null;

      // Validate that either image URL or image file is provided
      if (!imgUrl && !uploadedFile) {
          return res.status(400).json({ error: "Either Image URL or Image file is required." });
      }

      let imagePath;
      let imageName;
      let bannerRedirectUrl = redirectUrl || null; // Default to null if no redirect URL is provided

      // Process image URL
      if (imgUrl) {
          const imageExt = path.extname(new URL(imgUrl).pathname); // Get file extension from URL
          imageName = `ad_${Date.now()}${imageExt}`;
          imagePath = path.join(__dirname, 'public', 'imgs', 'banners', imageName);

          // Download the image
          const response = await axios({
              url: imgUrl,
              responseType: 'stream',
          });

          const writer = fs.createWriteStream(imagePath);
          response.data.pipe(writer);

          writer.on('finish', async () => {
              // Save banner data to the database, including optional redirect URL
              await pool.execute(
                  "INSERT INTO ads (image_path, link, open_in_new_tab, section) VALUES (?, ?, ?, ?)",
                  [`banners/${imageName}`, bannerRedirectUrl, openInTab ? 1 : 0, section]
              );
              res.redirect('/admin/banners');
          });

          writer.on('error', (err) => {
              console.error("Error saving image:", err);
              res.status(500).json({ error: "Failed to save image." });
          });
      } else if (uploadedFile) {
          // Process uploaded file
          const imageExt = path.extname(uploadedFile.name); // Get file extension of uploaded file
          imageName = `ad_${Date.now()}${imageExt}`;
          imagePath = path.join(__dirname, 'public', 'imgs', 'banners', imageName);

          // Save uploaded image to the server
          uploadedFile.mv(imagePath, async (err) => {
              if (err) {
                  console.error("Error saving uploaded image:", err);
                  return res.status(500).json({ error: "Failed to save uploaded image." });
              }

              // Save banner data to the database, including optional redirect URL
              await pool.execute(
                  "INSERT INTO ads (image_path, link, open_in_new_tab, section) VALUES (?, ?, ?, ?)",
                  [`banners/${imageName}`, bannerRedirectUrl, openInTab ? 1 : 0, section]
              );

              res.redirect('/admin/banners');
          });
      }

  } catch (error) {
      console.error("Error processing ad:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change password route
app.post("/admin/users/:userId/change-password", isAuthenticated, isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

app.post('/admin/set-permission', async (req, res) => {
  const { userId, permissionLevel } = req.body;
  const adminId = req.user.discord_id; // Ensure the requester is an admin
  
  // Check if the user making the request is an admin
  const [adminUser] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [adminId]);
  if (!adminUser || adminUser[0].isAdmin !== 2) {
      return res.status(403).json({ error: "Unauthorized" });
  }

  // Convert the permissionLevel to an integer for better comparison
  const intPermissionLevel = parseInt(permissionLevel, 10);

  // Ensure the permission level is a valid integer and one of the acceptable levels
  if (![0, 1, 2].includes(intPermissionLevel)) {
      return res.status(400).json({ error: "Invalid permission level" });
  }

  // Update the user's permission level
  await pool.query('UPDATE users SET isAdmin = ? WHERE id = ?', [intPermissionLevel, userId]);
  res.json({ success: true });
});



// Warn user route with reason parameter
app.post("/admin/users/warn", isAuthenticated, isAdmin, async (req, res) => {
  const { reason, userId } = req.body; // Expect a reason from the admin form
  try {
    // Update users table (optional if you want a summary count)
    await pool.query("UPDATE users SET warnings = warnings + 1 WHERE id = ?", [userId]);
    
    // Insert the warning details into the warnings table
    await pool.query(
      "INSERT INTO warnings (user_id, reason, created_at) VALUES (?, ?, NOW())",
      [userId, reason]
    );
    
    res.json({ success: true, message: "User warned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

// Ban user route (Delete user and add to blacklist)
app.post("/admin/users/:userId/ban", isAuthenticated, isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user's email and Discord ID before deleting
    const [user] = await pool.query("SELECT email, discord_id FROM users WHERE id = ?", [userId]);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { email, discord_id } = user[0];
    console.log(email)
    // Add to blacklist
    await pool.query("INSERT INTO blacklist (email, discord_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE email=email, discord_id=discord_id", [email, discord_id]);

    // Delete user from the users table
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ success: true, message: "User banned and blacklisted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


// GET Route - Admin Edit Form (updated to include serverTags)
app.get("/admin/edit-city/:id", isAdmin, async (req, res) => {
  const serverId = req.params.id;

  try {
    const [serverRows] = await pool.query('SELECT * FROM servers WHERE id = ?', [serverId]);

    if (serverRows.length === 0) {
      return res.status(404).send('Server not found');
    }

    const server = serverRows[0];
    const serverDetails = await fetchServerDetails(server.ip);
    
    // Format serverTags for display
    const formattedTags = server.serverTags 
      ? JSON.parse(server.serverTags).join(', ') 
      : '';

    res.render('a-cityedit', {
      server: { 
        ...server, 
        ...serverDetails,
        serverTags: formattedTags
      },
      serverId,
      session: req.session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/admin/edit-achievement/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const achievementId = req.params.id;
      const [[achievement]] = await pool.query('SELECT * FROM achievements WHERE id = ?', [achievementId]);

      if (!achievement) {
          return res.status(404).send('Achievement not found');
      }

      res.render('edit-achievement', { achievement, session: req.session });
  } catch (err) {
      console.error('Error retrieving achievement:', err);
      res.status(500).send('Error retrieving achievement');
  }
});

app.post('/admin/edit-achievement/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const achievementId = req.params.id;
      const { name, description } = req.body;

      await pool.query('UPDATE achievements SET name = ?, description = ? WHERE id = ?', [name, description, achievementId]);

      res.redirect('/admin/manage-achievements'); // Redirect back to achievements page
  } catch (err) {
      console.error('Error updating achievement:', err);
      res.status(500).send('Error updating achievement');
  }
});



// POST Route - Save Admin Edits (updated)
app.post('/admin/edit-city', async (req, res) => {
  try {
    const { membership, description, banner, discord, website, serverId, serverTags } = req.body;

    if (!serverId) {
      return res.status(400).json({ error: "Server ID is required." });
    }

    // Process serverTags
    let formattedTags = null;
    if (serverTags && typeof serverTags === 'string') {
      formattedTags = serverTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
        .join(','); // Convert back to a clean comma-separated string
    }

    // Build update query
    const fields = [
      "membership = ?",
      "description = ?",
      "discord_server = ?",
      "website = ?",
      "serverTags = ?",
      "pbanner = ?" // Directly save the link instead of downloading
    ];
    
    const values = [
      membership,
      description,
      discord,
      website,
      formattedTags || null,
      banner || null, // Just saving the URL, not downloading
      serverId
    ];
    


    const query = `UPDATE servers SET ${fields.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST route for deleting servers
app.post('/admin/delete-city', isAdmin, async (req, res) => {
  const { serverId } = req.body;

  if (!serverId) {
    return res.status(400).send('Server ID is required');
  }

  try {
    // Delete server from database
    await pool.query('DELETE FROM servers WHERE id = ?', [serverId]);
    await pool.query('DELETE FROM featured_cities WHERE server_id = ?', [serverId]);
    await pool.query('UPDATE user_votes SET server_name = "Unknown" WHERE server_id = ?', [serverId]);
    // Redirect to admin dashboard after successful deletion
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).send('Error deleting server');
  }
});

app.post('/feature-city', isAuthenticated, isAdmin, async (req, res) => {
  const { city, tier } = req.body;
  let duration = parseInt(req.body.duration) || 30; // Default to 30 days if not provided
  try {
    // Calculate the expiration date by adding the duration (in days) to the current date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(duration, 10)); // Convert duration to integer

    // Insert the city into the featured_cities table with expiration_date
    await pool.query(
      `INSERT INTO featured_cities (server_id, tier, expiration_date) 
       VALUES (?, ?, ?)`,
      [city, tier, expirationDate]
    );

    // Redirect or render a success message
    res.redirect('/');
  } catch (err) {
    console.error('Error featuring city:', err);
    res.status(500).send('Error featuring city');
  }
});

async function isAdmin(req, res, next) {
  try {

    const discordId = req.session.user.discord_id;

    // Query the database to check if the user is an admin
    const [result] = await pool.query('SELECT isAdmin FROM users WHERE discord_id = ?', [discordId]);

    if (result.length === 0) {
      return res.status(403).send("Access denied: User not found.");
    }

    const user = result[0];

    // Check if the user is an admin
    if (user.isAdmin == 2) {
      return next(); // User is authenticated and is an admin
    } else {
      res.status(403).send("Access denied: Admins only.");
    }
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).send("Internal server error.");
  }
}

async function isContractor(req, res, next) {
  try {

    const discordId = req.session.user.discord_id;

    // Query the database to check if the user is an admin
    const [result] = await pool.query('SELECT isAdmin FROM users WHERE discord_id = ?', [discordId]);

    if (result.length === 0) {
      return res.status(403).send("Access denied: User not found.");
    }

    const user = result[0];

    // Check if the user is an admin
    if (user.isAdmin == 1) {
      return next(); // User is authenticated and is an admin
    } else {
      res.status(403).send("Access denied: Admins only.");
    }
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).send("Internal server error.");
  }
}

async function generateInviteCodesForServers() {
  try {
    // Step 1: Find all servers without an vote_code
    const [servers] = await pool.execute(
      'SELECT id FROM servers WHERE invite_code IS NULL OR invite_code = ""'
    );

    // Step 2: Generate and update invite codes for each server
    for (const server of servers) {
      const inviteCode = uuidv4(); // Generate a unique invite code
      await pool.execute(
        'UPDATE servers SET invite_code = ? WHERE id = ?',
        [inviteCode, server.id]
      );
      console.log(`Generated invite code for server ${server.id}: ${inviteCode}`);
    }

    console.log(`Successfully generated invite codes for ${servers.length} servers.`);
  } catch (error) {
    console.error('Error generating invite codes:', error);
  }
}

async function generateInviteCode() {
  try {
    const inviteCode = uuidv4(); // Generate a unique invite code
    return inviteCode;
  } catch (error) {
    console.error('Error generating invite code:', error);
    return null; // Or throw the error if you want to handle it elsewhere
  }
}

async function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
      console.error('Webhook URL is missing!');
      return;
  }

  try {
      const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log('Webhook sent successfully!');
  } catch (error) {
      console.error('Failed to send webhook:', error);
  }
}


// Admin Page for Adding Servers
app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.redirect('/admin/dashboard')
});

app.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const itemsPerPage = 10; // Number of users to display per page
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const offset = (page - 1) * itemsPerPage;

    // Fetch total count of users for pagination
    const [[{ totalUsers }]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users`);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    // Fetch paginated users for the user management section
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.discord_id, 
        u.created_at, 
        u.isAdmin,
        u.ip,
        u.referrer,
        (SELECT method FROM user_activity WHERE user_id = u.id AND action = 'login' ORDER BY timestamp DESC LIMIT 1) AS last_login_method,
        (SELECT MAX(timestamp) FROM user_activity WHERE user_id = u.id AND action = 'login') AS last_login
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [itemsPerPage, offset]);

    // Fetch data for charts
    const [signupData] = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const [loginData] = await pool.query(`
      SELECT DATE(timestamp) AS date, COUNT(*) AS count
      FROM user_activity
      WHERE action = 'login'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);

    // Generate labels for all months
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Helper function to map data to months
    const mapDataToMonths = (data) => {
      const monthlyData = new Array(12).fill(0); // Initialize an array with 12 zeros (one for each month)

      data.forEach(entry => {
        const date = new Date(entry.date);
        const month = date.getMonth(); // Get the month index (0 for January, 11 for December)
        monthlyData[month] += entry.count; // Add the count to the corresponding month
      });

      return monthlyData;
    };

    // Format data for charts
    const formattedSignupData = {
      labels: months, // Use the months array as labels
      data: mapDataToMonths(signupData), // Map signup data to months
    };

    const formattedLoginData = {
      labels: months, // Use the months array as labels
      data: mapDataToMonths(loginData), // Map login data to months
    };
    
    // Render the admin dashboard with user data and pagination info
    res.render('user-management', {
      users,
      session: req.session,
      totalUsers, // Total number of users for pagination
      currentPage: page, // Current page for pagination
      itemsPerPage, // Items per page for pagination
      totalPages, // Total number of pages for pagination
      signupData: formattedSignupData, // Data for the signup chart
      loginData: formattedLoginData, // Data for the login chart
      months, // Pass the months array to the template
    });
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).send('Error retrieving users');
  }
});


app.get('/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    let userId = req.params.id;

    // Fetch user details
    let [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      [userRows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [userId]);
      userGet = userRows[0];
      userId = userGet.id;
    }

    const user = userRows[0];

    // Fetch additional relevant information (if needed)
    const [activityRows] = await pool.query(
      'SELECT action, method, timestamp FROM user_activity WHERE user_id = ? ORDER BY timestamp DESC',
      [userId]
    );

    // Combine user details and activity data
    const userDetails = {
      id: user.id,
      username: user.username,
      email: user.email,
      discord_id: user.discord_id,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      activity: activityRows, // Include user activity data
    };

    console.log(userDetails)
    // Send the response as JSON
    res.json(userDetails);
  } catch (err) {
    console.error('Error retrieving user details:', err);
    res.status(500).json({ error: 'Error retrieving user details' });
  }
});

app.get('/admin/banners', isAuthenticated, isAdmin, async (req, res) => {
  let [adRows] = await pool.query('SELECT * FROM ads');
  res.render('a-banners', { session: req.session, banners: adRows });
});

// Admin dashboard route
app.get('/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const itemsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * itemsPerPage;

    // Get total servers count
    const [[{ totalServers }]] = await pool.query(`SELECT COUNT(*) AS totalServers FROM servers`);

    // Get paginated servers
    const [servers] = await pool.query(
      `SELECT * FROM servers ORDER BY rank ASC LIMIT ? OFFSET ?`,
      [itemsPerPage, offset]
    );

    // Get recent servers
    const [recentServers] = await pool.query(`SELECT * FROM servers ORDER BY created_at DESC LIMIT 5`);

    // Collect all unique IPs from both server lists
    const allIps = [...servers, ...recentServers].map(server => server.ip);
    const uniqueIps = [...new Set(allIps)];

    // Fetch details for all unique IPs at once
    const ipDetails = await Promise.all(
      uniqueIps.map(ip => fetchServerDetails(ip))
    );

    // Create a map of IP to its details
    const detailsMap = {};
    uniqueIps.forEach((ip, index) => {
      detailsMap[ip] = ipDetails[index];
    });

    // Merge details with servers using the map
    const serversWithDetails = servers.map(server => ({
      ...server,
      ...detailsMap[server.ip],
      created_at: new Date(server.created_at)
    }));

    const recentServersWithDetails = recentServers.map(server => ({
      ...server,
      ...detailsMap[server.ip],
      created_at: new Date(server.created_at)
    }));

    res.render('a-dashboard', {
      session: req.session,
      recentServers: recentServersWithDetails,
      servers: serversWithDetails,
      totalServers,
      currentPage: page,
      itemsPerPage,
    });
  } catch (err) {
    console.error('Error retrieving servers for admin dashboard:', err);
    res.status(500).send('Error retrieving servers');
  }
});

app.get('/contractor/dashboard', isAuthenticated, isContractor, async (req, res) => {
  try {
    const contractorId = req.session.user.id; // Get contractor's user ID
    const contractorDiscordId = req.session.user.discord_id;
    const itemsPerPage = 3;

    // Get discount codes created by this contractor
    const [discountCodes] = await pool.query(
      `SELECT code, discount, expiry_date, uses, created_at 
       FROM contractor_discount_codes 
       WHERE contractor_id = ?
       ORDER BY created_at DESC 
       LIMIT 3`,
      [contractorId]
    );

    // Existing referral user logic
    const [users] = await pool.query("SELECT * FROM users WHERE referrer IS NOT NULL");
    const referredUsers = users.filter(user => {
      try {
        const referrerData = JSON.parse(user.referrer);
        return referrerData.discordId === contractorDiscordId;
      } catch (error) {
        console.error("Error parsing referrer JSON for user:", user.id, error);
        return false;
      }
    });

    // Pagination
    const totalUsers = referredUsers.length;
    const currentPage = parseInt(req.query.page) || 1;
    const totalPages = Math.ceil(totalUsers / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = referredUsers.slice(startIndex, startIndex + itemsPerPage);

    res.render('contractor-dashboard', {
      session: req.session,
      referredUsers: paginatedUsers,
      discountCodes, // Add discount codes to template context
      totalUsers,
      currentPage,
      totalPages,
      itemsPerPage,
      discountSuccess: req.query.discountSuccess === 'true'
    });
    
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).send('Error loading dashboard');
  }
});


app.get('/contractor/users', isAuthenticated, isContractor, async (req, res) => {
  try {
    const itemsPerPage = 10; // Number of users to display per page
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const offset = (page - 1) * itemsPerPage;

    // Fetch total count of users for pagination
    const [[{ totalUsers }]] = await pool.query(`SELECT COUNT(*) AS totalUsers FROM users`);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    // Fetch paginated users for the user management section
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.discord_id, 
        u.created_at, 
        u.isAdmin,
        u.ip,
        u.referrer,
        (SELECT method FROM user_activity WHERE user_id = u.id AND action = 'login' ORDER BY timestamp DESC LIMIT 1) AS last_login_method,
        (SELECT MAX(timestamp) FROM user_activity WHERE user_id = u.id AND action = 'login') AS last_login
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [itemsPerPage, offset]);

    // Fetch data for charts
    const [signupData] = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const [loginData] = await pool.query(`
      SELECT DATE(timestamp) AS date, COUNT(*) AS count
      FROM user_activity
      WHERE action = 'login'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);

    // Generate labels for all months
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Helper function to map data to months
    const mapDataToMonths = (data) => {
      const monthlyData = new Array(12).fill(0);
      data.forEach(entry => {
        const date = new Date(entry.date);
        const month = date.getMonth();
        monthlyData[month] += entry.count;
      });
      return monthlyData;
    };

    // Format data for charts
    const formattedSignupData = {
      labels: months,
      data: mapDataToMonths(signupData),
    };

    const formattedLoginData = {
      labels: months,
      data: mapDataToMonths(loginData),
    };

    // Render the contractor user management page (read-only)
    res.render('contractor-users-view', {
      users,
      session: req.session,
      totalUsers,
      currentPage: page,
      itemsPerPage,
      totalPages,
      signupData: formattedSignupData,
      loginData: formattedLoginData,
      months,
    });
  } catch (err) {
    console.error('Error retrieving users for contractor:', err);
    res.status(500).send('Error retrieving users');
  }
});

function generateDiscountCode(length = 8) {
  // Generate random bytes and convert to hexadecimal, then slice to the desired length and uppercase it.
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

app.post('/contractor/discount-codes', isAuthenticated, isContractor, async (req, res) => {
  try {
    const { discount } = req.body;
    const discountValue = parseFloat(discount);

    // Validate that discount is a number and does not exceed 10%
    if (isNaN(discountValue) || discountValue > 10) {
      return res.status(400).send("Discount must be a valid number and cannot exceed 10%");
    }

    // Retrieve contractor's ID from the session
    const contractorId = req.session.user.id;

    // Auto-generate the discount code (e.g., 8 characters)
    const generatedCode = generateDiscountCode(8);

    // Create PayPal coupon
    const createCoupon = new Promise((resolve, reject) => {
      const couponData = {
        "code": generatedCode,   // Using generated discount code
        "type": "DISCOUNT_PERCENTAGE",
        "value": discountValue,  // Discount value (e.g., 10)
        "duration": "ONETIME",   // For one-time use, can be "RECURRING" if applicable
        "duration_in_months": 1  // Duration for recurring discounts (optional)
      };

      // Call PayPal API to create the coupon
      paypal.billingAgreement.create(couponData, function (error, response) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });

    // Insert the generated discount code and discount value into your database
    await createCoupon;

    await pool.query(`
      INSERT INTO contractor_discount_codes (contractor_id, code, discount, created_at)
      VALUES (?, ?, ?, NOW())
    `, [contractorId, generatedCode, discountValue]);

    // Redirect back to the dashboard with a success flag (optional)
    res.redirect('/contractor/dashboard?discountSuccess=true');
  } catch (error) {
    console.error("Error creating discount code:", error);
    res.status(500).send("Error creating discount code");
  }
});



// Admin Page for Adding Servers
app.get('/admin/analytics', isAuthenticated, isAdmin, (req, res) => {
  res.render('analytics', {session: req.session});
});

app.get('/admin/analytics', isAuthenticated, isAdmin, (req, res) => {
  res.render('analytics', {session: req.session});
});

// Admin dashboard route
app.get('/admin/listings', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const itemsPerPage = 100; // Number of servers to display per page
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const offset = (page - 1) * itemsPerPage;

    // Fetch total count of servers for pagination
    const [[{ totalServers }]] = await pool.query(`SELECT COUNT(*) AS totalServers FROM servers`);

    // Fetch paginated servers for the listing management section
    const [servers] = await pool.query(
      `SELECT * FROM servers ORDER BY rank ASC LIMIT ? OFFSET ?`,
      [itemsPerPage, offset]
    );

    // Fetch additional details for the servers (if needed)
    const serversWithDetails = await Promise.all(
      servers.map(async (server) => {
        const details = await fetchServerDetails(server.ip); // Fetch extra server details
        return { ...server, ...details };
      })
    );

    // Render the admin dashboard with the server data and pagination info
    res.render('a-listing', {
      session: req.session,
      servers: serversWithDetails, // Pass paginated servers to the view
      totalServers, // Total number of servers for pagination
      currentPage: page, // Current page for pagination
      itemsPerPage, // Items per page for pagination
    });
  } catch (err) {
    console.error('Error retrieving servers for admin dashboard:', err);
    res.status(500).send('Error retrieving servers');
  }
});

app.post('/admin/add-server', isAuthenticated, isAdmin, async (req, res) => {
  const { ip, rank, membership } = req.body;
  var owner  = "Admin" 
  try {
    const inviteCode = await generateInviteCode();
    await pool.query(
      `INSERT INTO servers (ip, rank, owner, membership, invite_code) VALUES (?, ?, ?, ?, ?)`,
      [ip, rank, owner, membership, inviteCode]
    );

    const serverDetails = await fetchServerDetails(ip);
    const webhookMessage = {
      username: 'On Top Network',
      embeds: [{
        title: 'New City Added',
        color: 0x3498db,
        fields: [
          { name: 'Owner', value: `\`${owner}\``, inline: true },
          { name: 'Membership', value: `\`${membership}\``, inline: true },
          { name: 'CoT Invite Link', value: `https://cityontop.com/vote/${inviteCode}`, inline: false }
        ],
        image: { url: serverDetails.banner },
        footer: { 
          text: `On Top Network • ${new Date().toISOString()}`,
        }
      }]
    };
    
    // await sendWebhook(process.env.LISTING_WEBHOOK, webhookMessage);

    res.status(201).send('Server added successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding server');
  }
});

app.get('/check-ip', async (req, res) => {
  const { ip } = req.query;

  if (!ip) {
    return res.status(400).json({ exists: false, message: 'Invalid IP address.' });
  }

  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM servers WHERE ip = ?', [ip]);

    if (rows[0].count > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking IP:', error);
    return res.status(500).json({ exists: false, message: 'Database error.' });
  }
});

app.post('/user/redirect-to-cityontop', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login'); // Redirect to login if the user is not logged in
    }

    // Extract user info from the session
    const userId = req.session.user.id;

    // Fetch user details from the database
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return res.redirect('/login'); // Redirect to login if no matching user found
    }

    const user = rows[0];

    // Check if user is valid and has a linked Discord account
    if (!user.discord_id) {
      return res.redirect('/link-discord');  // Redirect to link Discord if not linked
    }

    // Generate JWT for the user
    const token = createAuthToken(user);

    // Optionally log the user activity
    // await pool.query('INSERT INTO user_activity (user_id, action, method) VALUES (?, ?, ?)', [user.id, 'redirect', 'cityontop']);

    // Redirect the user to CityOnTop with the token as a query parameter
    return res.redirect(`https://www.cityontop.com/user/cities?token=${token}`); // Pass the token as a query parameter
  } catch (err) {
    console.error('Error during redirect process:', err);
    res.status(500).send('Error redirecting to City On Top');
  }
});




app.get('/auth/discord', (req, res, next) => {
  const invite = req.query.invite || '';
  

  const cookies = new Cookies(req, res);
  cookies.set('invite', invite, { httpOnly: false, maxAge: 3600000 });

  next();
}, passport.authenticate('discord'));

// Discord callback after authentication
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/signup' }), async (req, res) => {
  try {
    const cookies = new Cookies(req, res);

    if (!req.user) {
      return res.redirect('/signup'); // If authentication failed, redirect to signup
    }

    const { discord_id, avatar, username } = req.user;
    const [rows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [discord_id]);

    if (rows.length > 0) {
      // Case 1: User already linked with Discord, proceed with login
      const user = rows[0];

      req.session.user = {
        id: user.id,
        username: user.username,
        discord_id,
        avatar,
        email: user.email,
        discord_username: username,
        isAdmin: user.isAdmin,
      };
      const userIp = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket.remoteAddress;; // Get user's IP address (for reCAPTCHA and region lookup)
      await pool.query('UPDATE users SET ip = ? WHERE id = ?', [userIp, user.id]);

      // Log user activity
      await pool.query('INSERT INTO user_activity (user_id, action, method) VALUES (?, ?, ?)', [user.id, 'login', 'discord']);
      const webhookMessage = {
        username: 'On Top Network',
        embeds: [{
          title: `User ${user.username} has logged in!`,
          color: 0x3498db,
          thumbnail: { url: user.avatar },
          fields: [
            { name: 'User ID', value: `\`${user.id}\``, inline: true },
            { name: 'Username', value: `\`${user.username}\``, inline: true },
            { name: 'Email', value: `\`${user.email}\``, inline: false },
            { name: 'Discord', value: `\`${user.discord_username}\``, inline: false },
            { name: 'Method', value: '`Discord`', inline: true }
          ],
          footer: { 
            text: `On Top Network • ${new Date().toISOString()}`,
          }
        }]
      };
      
      // await sendWebhook(process.env.LOGIN_WEBHOOK, webhookMessage);

      return res.redirect('/'); // Redirect to homepage/dashboard
    }

    // Case 2: User exists but not linked to Discord, update their record
    const userId = cookies.get('userid');
    if (userId) {
      await pool.query(
        'UPDATE users SET discord_id = ?, avatar = ?, discord_username = ? WHERE id = ?',
        [discord_id, avatar, username, userId]
      );

      // Fetch updated user details
      const [updatedUserRows] = await pool.query(
        'SELECT id, username, email, isAdmin, discord_id, avatar, discord_username FROM users WHERE id = ?',
        [userId]
      );

      if (updatedUserRows.length === 0) {
        return res.status(404).send('User not found.');
      }

      const updatedUser = updatedUserRows[0];

      // Set session with updated user details
      req.session.user = {
        id: updatedUser.id,
        username: updatedUser.username,
        discord_id: updatedUser.discord_id,
        avatar: updatedUser.avatar,
        email: updatedUser.email,
        discord_username: updatedUser.discord_username,
        isAdmin: updatedUser.isAdmin,
      };

      // Log user activity
      await pool.query('INSERT INTO user_activity (user_id, action, method) VALUES (?, ?, ?)', [updatedUser.id, 'signup', 'discord']);

      return res.redirect('/');
    }

    // Case 3: No matching user found
    return res.status(404).send('User not found.');
  } catch (err) {
    console.error('Error processing Discord login:', err);
    res.status(500).send('Error processing Discord login');
  }
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, invite } = req.body;

    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedInvite = sanitizeInput(invite);
    
    // Validate required fields
    if (!sanitizedUsername || !password || !sanitizedEmail) {
      return res.status(400).send('Missing required fields');
    }

    // Hash the password before storing it
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Generate a unique invite code for the new user
    const newInviteCode = crypto.randomBytes(6).toString('hex');

    let referrerData = null;

    // If an invite code was provided, find the user who owns it
    if (sanitizedInvite) {
      const [rows] = await pool.query('SELECT id, username, discord_id FROM users WHERE invite = ?', [sanitizedInvite]);
      if (rows.length > 0) {
        referrerData = {
          id: rows[0].id,
          username: rows[0].username,
          discordId: rows[0].discord_id,
        };
        // Increment the referral count for the referrer
        await pool.query('UPDATE users SET referrals = referrals + 1 WHERE id = ?', [rows[0].id]);
      }
    }

    // Insert the new user into the database
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, invite, referrer) VALUES (?, ?, ?, ?, ?)',
      [
        sanitizedUsername,
        hashedPassword,
        sanitizedEmail,
        newInviteCode,
        referrerData ? JSON.stringify(referrerData) : null,
      ]
    );

    if (result.affectedRows > 0) {
      // Get the user ID of the newly inserted user
      const userId = result.insertId;

      // Set session with the new user data (for now, without discord_id)
      req.session.user = {
        id: userId,
        username: sanitizedUsername,
        email: sanitizedEmail,
        invite: newInviteCode,
      };

      // Redirect to Discord linking page after signup, passing userId
      const cookies = new Cookies(req, res);
      cookies.set('userid', userId, { httpOnly: false, maxAge: 3600000 });
      const referrer = referrerData ? referrerData.username : 'none';
      console.log("userid", userId)
      const webhookMessage = {
        username: 'On Top Network',
        embeds: [{
          title: '👶 New User Signed Up!',
          color: 0x3498db,
          fields: [
            { name: 'User ID', value: `\`${req.session.user.id}\``, inline: true },
            { name: 'Username', value: `\`${req.session.user.username}\``, inline: true },
            { name: 'Email', value: `\`${req.session.user.email}\``, inline: false },
            { name: 'Referral', value: `\`${referrer}\``, inline: false }
          ],
          footer: { 
            text: `On Top Network • ${new Date().toISOString()}`,
          }
        }]
      };    
      // await sendWebhook(process.env.SIGNUP_WEBHOOK, webhookMessage);
      
      return res.redirect(`/auth/discord?invite=${sanitizedInvite}`);
    } else {
      console.error('Failed to insert user data.');
      return res.status(500).send('Error completing signup');
    }
  } catch (err) {
    console.error('Error during signup process:', err);
    res.status(500).send('Error during signup');
  }
});

// 🔹 LOGIN ENDPOINT
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Incorrect password" });

    req.session.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    res.json({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  });
});

// 🔹 Get current user (authenticated session)
app.get("/api/auth/user", (req, res) => {
  if (req.session.user) {
    return res.json(req.session.user);
  } else {
    return res.status(401).json({ error: "Not authenticated" });
  }
});


// 🔹 LOGOUT ENDPOINT
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

app.get('/sponsor/register', (req, res) => {
  res.render('sponsor', {session: req.session});
});


// Middleware to Protect Routes
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  
});
