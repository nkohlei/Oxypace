import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

export const configurePassport = () => {
    // Only configure Google OAuth if credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL,
                    proxy: true,
                    passReqToCallback: true
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        const state = req.query.state ? JSON.parse(decodeURIComponent(req.query.state)) : {};
                        const flow = state.action || 'login'; // 'login' or 'register'

                        console.log(`🔄 Passport Strategy: Flow=${flow}`);

                        // 1. Check if user exists
                        let user = await User.findOne({ googleId: profile.id });
                        if (!user) {
                            user = await User.findOne({ email: profile.emails[0].value });
                        }

                        // --- LOGIN FLOW ---
                        if (flow === 'login') {
                            if (user) {
                                // Provide googleId if linked via email match
                                if (!user.googleId) {
                                    user.googleId = profile.id;
                                    await user.save();
                                }
                                return done(null, user);
                            } else {
                                // User not found implies login failure
                                console.log('❌ Login failed: User not found');
                                return done(null, false, { message: 'Account not found. Please register.' });
                            }
                        }

                        // --- REGISTER FLOW ---
                        if (flow === 'register') {
                            if (user) {
                                // User already exists, just login
                                if (!user.googleId) {
                                    user.googleId = profile.id;
                                    await user.save();
                                }
                                return done(null, user);
                            } else {
                                // New User: Return TEMP profile (do not create in DB yet)
                                console.log('✅ New User detected (Register Flow). Returning temp profile.');
                                const tempUser = {
                                    _isTemp: true,
                                    googleId: profile.id,
                                    email: profile.emails[0].value,
                                    displayName: profile.displayName,
                                    avatar: profile.photos[0]?.value || ''
                                };
                                return done(null, tempUser);
                            }
                        }

                        done(new Error('Invalid flow state'));

                    } catch (error) {
                        done(error, null);
                    }
                }
            )
        );

        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await User.findById(id);
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        });

        console.log('✅ Google OAuth configured');
    } else {
        console.log('⚠️  Google OAuth not configured (missing credentials)');
    }
};
