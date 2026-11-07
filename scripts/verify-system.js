/**
 * Oxypace Pre-Build & Pre-Deploy System Verification Shield
 * Prevents runtime ReferenceErrors (no-undef), syntax errors, and regressions
 * in critical subsystems (WebRTC Voice/Video, Single-Session FCM Notifications).
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
let hasErrors = false;

function fail(section, message) {
    console.error(`❌ [${section}] ${message}`);
    hasErrors = true;
}

function pass(section, message) {
    console.log(`✅ [${section}] ${message}`);
}

console.log('🛡️  Starting Oxypace System Protection & Regression Check...');

// 1. Check Critical Architectural Invariants
try {
    // 1A. WebRTC Unified Plan Audio/Video Invariants
    const voicePath = path.join(rootDir, 'client/src/context/VoiceContext.jsx');
    if (fs.existsSync(voicePath)) {
        const voiceCode = fs.readFileSync(voicePath, 'utf8');

        if (!voiceCode.includes('const createPlaceholderAudioTrack =')) {
            fail('WebRTC-Guard', 'Missing createPlaceholderAudioTrack in VoiceContext.jsx');
        }
        if (!voiceCode.includes('const createPlaceholderVideoTrack =')) {
            fail('WebRTC-Guard', 'Missing createPlaceholderVideoTrack in VoiceContext.jsx');
        }
        if (!voiceCode.includes('pc.addTrack(primaryAudio, localStreamRef.current)') || !voiceCode.includes('pc.addTrack(primaryVideo, localStreamRef.current)')) {
            fail(
                'WebRTC-Guard',
                'Missing pc.addTrack(primaryAudio/primaryVideo, localStreamRef.current) in VoiceContext.jsx! Always use createPlaceholderAudioTrack() + pc.addTrack() for Unified Plan compatibility.'
            );
        }
        if (!voiceCode.includes('t.mid !== null')) {
            fail('WebRTC-Guard', 'Missing associated transceiver check (t.mid !== null) in VoiceContext.jsx');
        }
        if (!voiceCode.includes('isRemoteMuted={p.isMuted}')) {
            fail('WebRTC-Guard', 'Missing isRemoteMuted prop on AudioTrackPlayer in VoiceContext.jsx');
        }
        if (!hasErrors) {
            pass('WebRTC-Guard', 'Bidirectional Audio/Video Unified Plan invariants verified.');
        }
    } else {
        fail('WebRTC-Guard', 'client/src/context/VoiceContext.jsx not found!');
    }

    // 1B. Single-Session FCM & Notification Invariants
    const usersRoutePath = path.join(rootDir, 'routes/users.js');
    const authContextPath = path.join(rootDir, 'client/src/context/AuthContext.jsx');
    const pushServicePath = path.join(rootDir, 'services/pushService.js');

    if (fs.existsSync(usersRoutePath) && fs.existsSync(authContextPath) && fs.existsSync(pushServicePath)) {
        const usersCode = fs.readFileSync(usersRoutePath, 'utf8');
        const authContextCode = fs.readFileSync(authContextPath, 'utf8');
        const pushServiceCode = fs.readFileSync(pushServicePath, 'utf8');

        if (!usersCode.includes("router.post('/fcm-token'") || !usersCode.includes("router.post('/unbind-fcm-token'")) {
            fail('FCM-Guard', 'Missing /fcm-token or /unbind-fcm-token endpoints in routes/users.js');
        }
        if (!authContextCode.includes('AuthSync.syncAuth') || !authContextCode.includes('/api/users/unbind-fcm-token')) {
            fail('FCM-Guard', 'Missing native AuthSync.syncAuth or /api/users/unbind-fcm-token in AuthContext.jsx');
        }
        if (!pushServiceCode.includes('senderAvatar') || !pushServiceCode.includes('imageUrl')) {
            fail('FCM-Guard', 'Missing senderAvatar / imageUrl separation in services/pushService.js');
        }
        if (!hasErrors) {
            pass('FCM-Guard', 'Single-session FCM isolation & notification media invariants verified.');
        }
    } else {
        fail('FCM-Guard', 'Required FCM/Auth files missing.');
    }
} catch (err) {
    fail('Invariant-Check', err.message);
}

// 2. Run ESLint Runtime Crash Checks (no-undef, jsx-no-undef, no-dupe-keys, no-const-assign)
try {
    // Backend static check
    execSync(
        'npx eslint server.js routes models utils middleware --rule "no-undef: error" --rule "no-unused-vars: off" --rule "prefer-const: off" --rule "eqeqeq: off" --rule "curly: off" --rule "security/detect-object-injection: off" --rule "security/detect-non-literal-regexp: off" --rule "security/detect-unsafe-regex: off" --max-warnings 9999',
        { stdio: 'inherit', cwd: rootDir }
    );
    pass('Backend-Static-Check', 'Zero undefined variables or syntax errors in backend.');
} catch (err) {
    fail('Backend-Static-Check', 'Backend ESLint runtime safety check failed!');
}

try {
    // Frontend static check (checks modified .js/.jsx files + critical core files, or full client/src with --full)
    const isFull = process.argv.includes('--full');
    let targetFiles = ['client/src'];

    if (!isFull) {
        const coreFiles = [
            'client/src/context/VoiceContext.jsx',
            'client/src/context/AuthContext.jsx',
            'client/src/pages/Portal.jsx',
            'client/src/pages/Settings.jsx',
            'client/src/components/VoiceChannel.jsx',
            'client/src/components/ConferenceChannel.jsx',
        ];
        let gitModified = [];
        try {
            const diffOut = execSync('git status --porcelain client/src', { encoding: 'utf8', cwd: rootDir });
            gitModified = diffOut
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => line.replace(/^[A-Z?]+\s+/, '').trim())
                .filter((f) => /\.(js|jsx)$/.test(f) && fs.existsSync(path.join(rootDir, f)));
        } catch (_) {}

        targetFiles = [...new Set([...coreFiles, ...gitModified])].filter((f) =>
            fs.existsSync(path.join(rootDir, f))
        );
    }

    if (targetFiles.length > 0) {
        const fileArgs = targetFiles.map((f) => `"${f}"`).join(' ');
        execSync(`npx --prefix client eslint ${fileArgs} --no-config-lookup -c client/eslint.config.js`, {
            stdio: 'inherit',
            cwd: rootDir,
        });
    }
    pass('Frontend-Static-Check', `Zero undefined variables or JSX errors (${targetFiles.length} target(s) checked).`);
} catch (err) {
    fail('Frontend-Static-Check', 'Frontend ESLint runtime safety check failed!');
}

if (hasErrors) {
    console.error('\n🚨 [VERIFY FAILED] Build/Deploy aborted to protect production systems.');
    process.exit(1);
} else {
    console.log('✨ [VERIFY PASSED] All static & architectural checks succeeded.\n');
}

