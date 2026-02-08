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
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        console.log('🔄 Passport Strategy Executing...');

                        // 1. Check if user exists
                        let user = await User.findOne({ googleId: profile.id });
                        if (!user) {
                            user = await User.findOne({ email: profile.emails[0].value });
                        }

                        if (user) {
                            // Link Google account if not already linked
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                await user.save();
                            }
                            return done(null, user);
                        }

                        // User doesn't exist? Return TEMP profile.
                        // The Controller will decide whether to allow Registration or Reject (Login flow)
                        console.log(
                            '✅ New User detected. Returning temp profile for controller decision.'
                        );
                        const tempUser = {
                            _isTemp: true,
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            displayName: profile.displayName,
                            avatar: profile.photos[0]?.value || '',
                        };
                        return done(null, tempUser);
                    } catch (error) {
                        console.error('Passport Strategy Error:', error);
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
