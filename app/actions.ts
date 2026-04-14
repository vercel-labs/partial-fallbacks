"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

export async function rollSuffix() {
  const suffix = Math.random().toString(36).slice(2, 6);

  const cookieJar = await cookies();

  cookieJar.set("rec", suffix, { path: "/" });

  refresh();
}
