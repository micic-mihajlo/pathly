import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export const alt = 'Pathly - Your Smart Transit Companion';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';
export default async function Image() {
    return new ImageResponse((<div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: 'system-ui',
        }}>
        <div style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 24,
        }}>
          Pathly
        </div>
        <div style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            maxWidth: 800,
        }}>
          Your Smart Transit Companion
        </div>
      </div>), Object.assign({}, size));
}
