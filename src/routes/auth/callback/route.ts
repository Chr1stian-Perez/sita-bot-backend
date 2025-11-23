import { type NextRequest, NextResponse } from "next/server"

const COGNITO_CONFIG = {
  region: process.env.NEXT_PUBLIC_COGNITO_REGION,
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI,
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 })
    }

    console.log("[v0] Token exchange config:", {
      region: COGNITO_CONFIG.region,
      userPoolId: COGNITO_CONFIG.userPoolId,
      clientId: COGNITO_CONFIG.clientId,
      redirectUri: COGNITO_CONFIG.redirectUri,
      domain: COGNITO_CONFIG.domain,
      hasClientSecret: !!COGNITO_CONFIG.clientSecret,
    })

    const tokenEndpoint = `${COGNITO_CONFIG.domain}/oauth2/token`

    const auth = Buffer.from(`${COGNITO_CONFIG.clientId}:${COGNITO_CONFIG.clientSecret || ""}`).toString("base64")

    console.log("[v0] Token endpoint URL:", tokenEndpoint)
    console.log("[v0] Using Basic Auth with client_id:", COGNITO_CONFIG.clientId)

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: COGNITO_CONFIG.redirectUri,
        client_id: COGNITO_CONFIG.clientId,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      })
      return NextResponse.json({ error: "Token exchange failed", details: errorText }, { status: 401 })
    }

    const tokens = await tokenResponse.json()

    return NextResponse.json({
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      expires_in: tokens.expires_in,
    })
  } catch (error) {
    console.error("[v0] Callback error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

// Handle redirect from Cognito authorization endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("[v0] Cognito error:", error)
      return NextResponse.redirect(new URL(`/?error=${error}`, request.nextUrl.origin))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/?error=no_code", request.nextUrl.origin))
    }

    // Redirect to home with code - frontend will exchange it for tokens
    return NextResponse.redirect(new URL(`/?code=${code}`, request.nextUrl.origin))
  } catch (error) {
    console.error("[v0] Callback GET error:", error)
    return NextResponse.redirect(new URL("/?error=callback_failed", request.nextUrl.origin))
  }
}
