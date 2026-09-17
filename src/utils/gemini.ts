const SYSTEM_PROMPT = `Ты AI-консультант платформы AdmitRoute для абитуриентов Казахстана и СНГ.
Отвечай кратко, конкретно и по делу на русском. Фокус: гранты, IELTS/SAT/ЕНТ, мотивационные эссе,
дедлайны вузов (NU, AITU, KAIST, Bocconi, Stipendium Hungaricum), стратегия поступления.
Не выдумывай точные даты если не уверен — предлагай проверить официальный портал.`;

export async function askAdmissionAssistant(userMessage: string, apiKey?: string): Promise<string> {
  const key = (apiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();

  if (key) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error (${resp.status})`);
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('\n');
    if (text?.trim()) return text.trim();
    throw new Error('Пустой ответ модели');
  }

  return localAdvisorFallback(userMessage);
}

function localAdvisorFallback(userMessage: string): string {
  const q = userMessage.toLowerCase();
  if (q.includes('грант') || q.includes('стипенд') || q.includes('бесплат')) {
    return 'Основные 100% гранты: госгрант МНВО РК (ЕНТ), грант NU, KAIST KISS, Stipendium Hungaricum, Need-blind колледжи США (Harvard, MIT, Princeton). Подбирайте вуз под бюджет «grant_only» и закрывайте IELTS 6.5+.';
  }
  if (q.includes('эссе') || q.includes('мотивац') || q.includes('statement')) {
    return 'Сильное эссе: 1) крючок из личного кейса, 2) 1–2 измеримых проекта, 3) why this university (кафедра/лаба), 4) карьерная цель. Избегайте шаблона «с детства мечтал».';
  }
  if (q.includes('ielts') || q.includes('toefl') || q.includes('sat') || q.includes('ент')) {
    return 'Ориентиры: IELTS 6.5 (секции ≥ 6.0) для NU/Европы, 7.5+ для топ-Азии/US. SAT 1240 минимум NU, конкурентный 1420+. ЕНТ 105+ на IT-грант, 120+ — уверенный диапазон.';
  }
  if (q.includes('дедлайн') || q.includes('срок') || q.includes('когда')) {
    return 'США Early: ~1 ноября; Regular: 1–15 января. NU: ранняя осень/зима и основной раунд весной. KAIST и Hungaricum — обычно зима–весна. Сверяйте дату на официальном портале вуза.';
  }
  return 'Могу помочь с грантами, тестами, эссе и дедлайнами. Добавьте бесплатный ключ Gemini в настройках чата — ответы станут персональнее. Пока уточните: страна, GPA и целевой вуз.';
}
