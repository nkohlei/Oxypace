import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, isReloading: false };
    }

    static getDerivedStateFromError(error) {
        // Automatically trigger a reload if it's a chunk loading error from Vite
        if (error && error.message && error.message.includes('Failed to fetch dynamically imported module')) {
            return { hasError: true, isReloading: true, error };
        }
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        if (error && error.message && error.message.includes('Failed to fetch dynamically imported module')) {
            window.location.reload();
            return;
        }

        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.isReloading) {
            return (
                <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', background: '#0a0a0a' }}>
                    Yenileniyor...
                </div>
            );
        }

        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '40px',
                        color: '#e74c3c',
                        background: '#1a1a1a',
                        height: '100vh',
                        fontFamily: 'monospace',
                        overflow: 'auto',
                    }}
                >
                    <h1>⚠️ Uygulama Hatası (Crash)</h1>
                    <p>
                        Uygulama beklenmedik bir şekilde durdu. Aşağıdaki hatayı geliştiriciye
                        iletin:
                    </p>

                    <div
                        style={{
                            background: '#333',
                            padding: '20px',
                            borderRadius: '8px',
                            marginTop: '20px',
                            border: '1px solid #555',
                        }}
                    >
                        <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>
                            {this.state.error && this.state.error.toString()}
                        </h3>
                        <details style={{ whiteSpace: 'pre-wrap', color: '#ccc' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                                Detayları Göster (Stack Trace)
                            </summary>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                    </div>

                    <button
                        onClick={() => (window.location.href = '/')}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Sayfayı Yenile
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
