/**
 * Route Handler para autenticación con Taiga
 * Valida credenciales y devuelve token
 */

import { NextRequest, NextResponse } from "next/server";
import { TaigaClient, TaigaApiError } from "@/lib/taiga";

interface AuthRequest {
  username: string;
  password: string;
  taigaUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Autenticación con credenciales
    const { username, password, taigaUrl } = body as AuthRequest;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 },
      );
    }

    if (!taigaUrl) {
      return NextResponse.json(
        { error: "URL de Taiga requerida" },
        { status: 400 },
      );
    }

    // Crear cliente con la URL proporcionada
    const client = new TaigaClient(taigaUrl);

    const authResponse = await client.authenticate({
      username,
      password,
      type: "normal",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authResponse.id,
        username: authResponse.username,
        full_name: authResponse.full_name,
        email: authResponse.email,
        photo: authResponse.photo,
      },
      token: authResponse.auth_token,
    });
  } catch (error) {
    console.error("Error en autenticación:", error);

    if (error instanceof TaigaApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
