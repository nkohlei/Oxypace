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
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // Check if user exists
                        let user = await User.findOne({ googleId: profile.id });

                        if (user) {
                            return done(null, user);
                        }

                        // Check if email already exists
                        user = await User.findOne({ email: profile.emails[0].value });

                        if (user) {
                            // Link Google account to existing user
                            user.googleId = profile.id;
                            user.isVerified = true; // Auto-verify Google users
                            await user.save();
                            return done(null, user);
                        }

                        // Create new user
                        const username = profile.emails[0].value.split('@')[0] + Math.floor(Math.random() * 1000);

                        user = await User.create({
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            username,
                            isVerified: true,
                            profile: {
                                displayName: profile.displayName,
                                avatar: profile.photos[0]?.value || '',
                            },
                        });

                        user._isNew = true;

                        done(null, user);
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
