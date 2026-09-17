import { ApplicantProfile, DiagnosticResult, University, RoadmapStep, FitTier } from '../types';
import { UNIVERSITY_DATABASE, UNIVERSITY_BY_ID } from '../data/universities';
import { estimateChance, parseAcceptanceRate } from '../../shared/logic/chance.js';

// Normalize GPA to 4.0 scale
function getNormalizedGpa(gpa: number, scale: '4.0' | '5.0'): number {
  if (scale === '5.0') {
    return Math.min(4.0, (gpa / 5.0) * 4.0);
  }
  return Math.min(4.0, gpa);
}

// 1. Diagnostic Engine
export function runDiagnostic(profile: ApplicantProfile): DiagnosticResult {
  const normGpa = getNormalizedGpa(profile.gpa, profile.gpaScale);
  
  // Academic readiness (0 - 100)
  let academic = Math.round((normGpa / 4.0) * 80);
  if (profile.hasSat && profile.satScore) {
    if (profile.satScore >= 1500) academic += 20;
    else if (profile.satScore >= 1400) academic += 15;
    else if (profile.satScore >= 1250) academic += 10;
    else academic += 5;
  } else if (profile.hasUnt && profile.untScore) {
    if (profile.untScore >= 120) academic += 20;
    else if (profile.untScore >= 100) academic += 15;
    else academic += 8;
  } else {
    academic += 5;
  }
  academic = Math.min(100, Math.max(30, academic));

  // Language readiness (0 - 100)
  let language = 50;
  if (profile.hasIelts && profile.ieltsScore) {
    if (profile.ieltsScore >= 7.5) language = 98;
    else if (profile.ieltsScore >= 7.0) language = 90;
    else if (profile.ieltsScore >= 6.5) language = 80;
    else if (profile.ieltsScore >= 6.0) language = 68;
    else language = 55;
  } else {
    language = 45;
  }

  // Portfolio & Extracurriculars (0 - 100)
  let portfolio = 40;
  if (profile.olympiadLevel === 'international') portfolio += 55;
  else if (profile.olympiadLevel === 'republican') portfolio += 45;
  else if (profile.olympiadLevel === 'city') portfolio += 30;
  else if (profile.olympiadLevel === 'school') portfolio += 15;

  portfolio += Math.min(25, profile.leadershipActivities.length * 10);
  portfolio = Math.min(100, portfolio);

  // Financial Feasibility (0 - 100)
  let financialFeasibility = 80;
  if (profile.budgetTier === 'grant_only') {
    // Grant only is totally fine, but requires matching with full funding
    financialFeasibility = (academic >= 80 || portfolio >= 75) ? 90 : 70;
  } else if (profile.budgetTier === 'up_to_5k') {
    financialFeasibility = 85;
  } else {
    financialFeasibility = 95;
  }

  const overall = Math.round((academic * 0.35) + (language * 0.25) + (portfolio * 0.25) + (financialFeasibility * 0.15));

  // Strengths identification
  const strengths: { title: string; desc: string; icon: string }[] = [];
  
  if (normGpa >= 3.7) {
    strengths.push({
      title: 'Сильный академический фундамент (GPA ' + profile.gpa + ')',
      desc: 'Ваш средний балл входит в топ-10% выпускников и закрывает требования топовых университетов Казахстана, Европы и Азии.',
      icon: 'GraduationCap'
    });
  }

  if (profile.hasIelts && profile.ieltsScore && profile.ieltsScore >= 7.0) {
    strengths.push({
      title: 'Превосходный языковой уровень (IELTS ' + profile.ieltsScore + ')',
      desc: 'Балл выше минимального порога 95% англоязычных программ мира. Языковой барьер снят.',
      icon: 'Languages'
    });
  } else if (profile.hasIelts && profile.ieltsScore && profile.ieltsScore >= 6.5) {
    strengths.push({
      title: 'Уверенный академический английский (IELTS ' + profile.ieltsScore + ')',
      desc: 'Соответствует требованиям прямого поступления в Nazarbayev University, европейские и азиатские вузы.',
      icon: 'Languages'
    });
  }

  if (profile.olympiadLevel === 'republican' || profile.olympiadLevel === 'international') {
    strengths.push({
      title: 'Олимпиадный статус национального уровня',
      desc: 'Диплом призера олимпиады дает право на внеконкурсные гранты и преимущество при отборе в KAIST, HKUST и NU.',
      icon: 'Trophy'
    });
  }

  if (profile.leadershipActivities.length >= 2) {
    strengths.push({
      title: 'Активный профиль внеклассной деятельности',
      desc: 'Участие в клубах и проектах усиливает заявку при целостном рассмотрении (Holistic Review).',
      icon: 'Users'
    });
  }

  if (profile.hasSat && profile.satScore && profile.satScore >= 1450) {
    strengths.push({
      title: 'Выдающийся результат SAT (' + profile.satScore + ')',
      desc: 'Math/Reading результат позволяет конкурировать за Full-Ride стипендии в США, Корее и Гонконге.',
      icon: 'Award'
    });
  }

  // Fallback strength if needed
  if (strengths.length === 0) {
    strengths.push({
      title: 'Четкая цель и осознанный старт',
      desc: 'Своевременное планирование в ' + (profile.grade === 'grade_10' ? '10-м' : '11-м') + ' классе оставляет запас времени на подготовку.',
      icon: 'Compass'
    });
  }

  // Bottlenecks / Risks identification
  const bottlenecks: { title: string; desc: string; severity: 'high' | 'medium' | 'info'; action: string }[] = [];

  if (!profile.hasSat && (profile.targetRegions.includes('usa_canada') || profile.targetRegions.includes('asia'))) {
    bottlenecks.push({
      title: 'Отсутствие стандартизированного теста SAT',
      desc: 'Для подачи в топ-вузы США, KAIST и получения 100% гранта в Гонконге необходим сертификат SAT с высоким баллом.',
      severity: 'high',
      action: 'Зарегистрироваться на ближайшую сессию Digital SAT и составить 8-недельный план подготовки.'
    });
  }

  if (profile.budgetTier === 'grant_only') {
    bottlenecks.push({
      title: 'Финансовое ограничение: только 100% грант',
      desc: 'Платные формы обучения исключены. Стратегия должна фокусироваться на госгрантах МНВО РК, NU, Stipendium Hungaricum, KAIST KISS и Need-Blind колледжах.',
      severity: 'medium',
      action: 'Диверсифицировать список вузов программами с гарантированным полным финансированием.'
    });
  }

  if (!profile.hasIelts) {
    bottlenecks.push({
      title: 'Нет подтвержденного языкового сертификата',
      desc: 'Без официального IELTS/TOEFL большинство зарубежных программ и NU не примут документы к основному конкурсу.',
      severity: 'high',
      action: 'Сдать диагностический mock-тест IELTS и забронировать официальную дату сдачи.'
    });
  } else if (profile.ieltsScore && profile.ieltsScore < 6.5) {
    bottlenecks.push({
      title: 'IELTS ' + profile.ieltsScore + ' — в зоне риска для зарубежных программ',
      desc: 'Для топовых зарубежных вузов и прямого поступления в NU без подготовительного года (NUFYP) требуется 6.5+ (no band < 6.0).',
      severity: 'medium',
      action: 'Подтянуть секции Writing и Speaking с упором на академическую лексику.'
    });
  }

  if (profile.leadershipActivities.length === 0) {
    bottlenecks.push({
      title: 'Дефицит подтвержденного внеклассного портфолио',
      desc: 'Для вузов США и Европы одного табеля с оценками недостаточно — требуется подтверждение инициативности.',
      severity: 'medium',
      action: 'Запустить собственный социальный проект или присоединиться к волонтерской организации в течение 3 месяцев.'
    });
  }

  // Strategic advice tailored by advisor tone
  let strategicAdvice = '';
  if (profile.advisorTone === 'strategic') {
    strategicAdvice = `Рекомендуется стратегия тройного эшелона: 2 амбициозных Dream-вуза с полным грантом (KAIST, NYUAD), 2 надежных Target-варианта (Nazarbayev University, Constructor/Jacobs) и 1 железобетонный Safety-вариант (AITU по госгранту). Главная точка приложения усилий сейчас — ${!profile.hasSat ? 'сдача Digital SAT на 1450+' : 'шлифовка мотивационного эссе'}.`;
  } else if (profile.advisorTone === 'academic') {
    strategicAdvice = `Ваш академический профиль демонстрирует высокую дисциплину. Для перехода на уровень топ-мировых программ следует сфокусироваться на профильных дисциплинах STEM, подготовке развернутого портфолио исследовательских проектов и получении детализированных академических рекомендаций от преподавателей.`;
  } else {
    strategicAdvice = `У вас отличный стартовый потенциал! Самое главное сейчас — не распыляться на десятки вузов, а уверенно идти по шагам. Мы сформировали для вас сбалансированный маршрут, где риск не поступить сведен к минимуму благодаря сильным запасным планам с бесплатным обучением.`;
  }

  const recommendedCategoryFocus = (profile.budgetTier === 'grant_only') 
    ? 'Госгранты Казахстана + 100% Зарубежные правительственные стипендии'
    : 'Сбалансированные англоязычные программы Европы и Центральной Азии';

  return {
    readiness: {
      overall,
      academic,
      language,
      portfolio,
      financialFeasibility,
    },
    strengths,
    bottlenecks,
    strategicAdvice,
    recommendedCategoryFocus,
  };
}

// 2. Personalization & University Matching Engine
export function matchUniversities(profile: ApplicantProfile): University[] {
  const normGpa = getNormalizedGpa(profile.gpa, profile.gpaScale);
  const userIelts = profile.hasIelts ? (profile.ieltsScore || 6.0) : 5.5;
  const userSat = profile.hasSat ? (profile.satScore || 1200) : 0;
  const userUnt = profile.hasUnt ? (profile.untScore || 80) : 0;

  // Filter and score universities
  const scored = UNIVERSITY_DATABASE.map(uni => {
    let score = 70;
    
    // Major compatibility bonus
    const majorMatch = uni.supportedMajors.some(m => profile.targetMajors.includes(m));
    if (majorMatch) score += 15;

    // Region preference bonus
    const regionMatch = profile.targetRegions.includes(uni.region);
    if (regionMatch) score += 10;

    // Academic threshold check
    const gpaDiff = normGpa - uni.minGpa;
    if (gpaDiff >= 0.3) score += 10;
    else if (gpaDiff >= 0) score += 5;
    else score -= 15;

    // Language threshold check
    const ieltsDiff = userIelts - uni.minIelts;
    if (ieltsDiff >= 0.5) score += 8;
    else if (ieltsDiff >= 0) score += 4;
    else score -= 12;

    // SAT check if applicable
    if (uni.minSat) {
      if (userSat >= uni.minSat + 50) score += 10;
      else if (userSat >= uni.minSat) score += 5;
      else if (userSat === 0) score -= 10;
      else score -= 15;
    }

    // UNT check if applicable
    if (uni.minUnt) {
      if (userUnt >= uni.minUnt + 15) score += 10;
      else if (userUnt >= uni.minUnt) score += 5;
      else if (userUnt === 0 && uni.region === 'kazakhstan') score -= 5;
    }

    // Olympiad bonus — selective universities (≤ 20% acceptance) weigh awards the most
    if (profile.olympiadLevel === 'republican' || profile.olympiadLevel === 'international') {
      if (parseAcceptanceRate(uni.acceptanceRate) <= 20) score += 15;
      else score += 6;
    }

    // Lifestyle fit from the extended knowledge base (climate preference, safety, diet)
    if (uni.environment && profile.climatePreference && profile.climatePreference !== 'any') {
      const climate = uni.environment.climate.toLowerCase();
      const warm = /жарк|тёпл|тепл|субтроп|средиземн|экватор|пустын/.test(climate);
      const cold = /холодн|снежн|резко|суров/.test(climate);
      if (profile.climatePreference === 'warm' && warm) score += 4;
      if (profile.climatePreference === 'warm' && cold) score -= 4;
      if (profile.climatePreference === 'cold' && cold) score += 3;
      if (profile.climatePreference === 'mild' && !warm && !cold) score += 3;
    }
    if (uni.campus && uni.campus.neighborhoodSafety <= 5) score -= 3;
    if (profile.dietaryNeeds && /хал|halal/i.test(profile.dietaryNeeds) && uni.environment) {
      const halal = uni.environment.foodOptions.some((f) => /хал|halal/i.test(f));
      score += halal ? 2 : -4;
    }

    // Budget compatibility
    if (profile.budgetTier === 'grant_only') {
      if (uni.hasFullGrantOrScholarship) {
        score += 10;
      } else if (uni.tuitionUSDPerYear > 5000) {
        score -= 40; // Heavy penalty if no full grant and expensive
      }
    } else if (profile.budgetTier === 'up_to_5k') {
      if (uni.tuitionUSDPerYear <= 5000 || uni.hasFullGrantOrScholarship) {
        score += 5;
      } else {
        score -= 20;
      }
    }

    score = Math.min(98, Math.max(45, score));

    // Fit tier comes from the shared, explainable chance model (same numbers the backend and the details panel use)
    const chance = estimateChance(profile, uni);
    const fitTier: FitTier = chance.tier;

    // Generate clear, human-language "Why it fits" explanation tailored to user's exact inputs
    let customWhyItFits = '';
    const grantMention = (profile.budgetTier === 'grant_only' || profile.budgetTier === 'up_to_5k')
      ? `Учитывая ваше требование к финансированию (${profile.budgetTier === 'grant_only' ? 'только 100% грант' : 'бюджет до $5,000'}), программа ${uni.scholarshipName} полностью снимает нагрузку на семейный бюджет. `
      : '';

    if (uni.id === 'nu') {
      customWhyItFits = `Ваш средний балл (GPA ${profile.gpa}) и уровень английского (IELTS ${userIelts}) соответствуют профилю зачисленных студентов Назарбаев Университета. ${grantMention}Обучение на 100% покрывается государственным грантом с ежемесячной стипендией.`;
    } else if (uni.id === 'aitu') {
      customWhyItFits = `Идеальный вариант для направления ${profile.targetMajors.includes('cs_ai') ? 'Computer Science & AI' : 'Software Engineering'}. ${profile.hasUnt ? `Ваш балл ЕНТ (${userUnt}) дает высокие шансы на распределение госгранта МНВО РК.` : 'Позволяет получить гарантированный государственный грант по профилю Математика + Информатика.'} Кампус в Astana Hub обеспечивает прямой выход на работодателей.`;
    } else if (uni.id === 'kaist') {
      customWhyItFits = `Как сильному STEM-кандидату ${profile.olympiadLevel !== 'none' ? 'с подтвержденным олимпиадным опытом' : 'с фокусом на технологии'}, KAIST предлагает обучение в топ-1 технологическом институте Азии со 100% стипендией KISS и ежемесячным пособием.`;
    } else if (uni.id === 'constructor') {
      customWhyItFits = `Качественное немецкое образование на 100% английском языке. Ваш GPA ${profile.gpa} попадает в диапазон успешных кандидатов, а программа отложенной оплаты JU Study Plan позволяет учиться без непосильных стартовых взносов.`;
    } else if (uni.id === 'bocconi') {
      customWhyItFits = `Ведущая бизнес-школа континентальной Европы. Для студентов из Центральной Азии действует программа ISU Bocconi, которая при предоставлении справок о доходах семьи (2-НДФЛ) полностью оплачивает обучение и выделяет денежную стипендию на жизнь в Милане.`;
    } else if (uni.id === 'hungaricum_bme') {
      customWhyItFits = `Межправительственная программа Stipendium Hungaricum — один из самых доступных способов получить европейский инженерный диплом: 100% грант, бесплатное общежитие и стипендия. Ваш балл IELTS ${userIelts} превышает входной порог (6.0).`;
    } else if (uni.id === 'sdu') {
      customWhyItFits = `Университет предоставляет отличную базу по IT и бизнесу. Участие во внутренней олимпиаде SDU SPT позволяет выиграть 100% грант на все 4 года бакалавриата еще до сдачи школьных выпускных экзаменов.`;
    } else {
      customWhyItFits = uni.whyItFits + ' ' + grantMention;
    }

    return {
      ...uni,
      matchScore: score,
      fitTier,
      whyItFits: customWhyItFits,
    };
  });

  // Sort by match score descending, ensure at least one Dream, Target, and Safety
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Return filtered or prioritized list (at least 6 best matches)
  return scored;
}

// 3. Dynamic Roadmap Generator
export function generateRoadmap(profile: ApplicantProfile, matchedUnis: University[]): RoadmapStep[] {
  const is11th = profile.grade === 'grade_11';
  const targetYear = profile.targetYear;
  const targetMajorTitle = profile.targetMajors[0] ? profile.targetMajors[0].toUpperCase() : 'IT & STEM';

  // One concrete subtask per university the applicant selected, with its real deadline and portal
  const targetUniSubtasks = (profile.targetUniversityIds || [])
    .map((id) => UNIVERSITY_BY_ID.get(id))
    .filter((u): u is University => Boolean(u))
    .slice(0, 6)
    .map((u) => ({
      id: `dl-uni-${u.id}`,
      title: `Подать заявку в ${u.shortName}: ${u.earlyDeadline ? `ранний раунд ${u.earlyDeadline}, ` : ''}основной ${u.regularDeadline} (${u.officialPortalUrl})`,
      isCompleted: false,
      deadline: u.regularDeadline,
    }));

  const steps: RoadmapStep[] = [
    {
      id: 'step-exams',
      title: 'Стандартизированные экзамены (IELTS / SAT / ЕНТ)',
      category: 'exams',
      timeFrame: 'immediate',
      targetDate: is11th ? 'Октябрь - Ноябрь 2026' : 'Весна 2027',
      description: 'Закрытие главного формального барьера для участия во всех стипендиальных конкурсах.',
      isKeyMilestone: true,
      guidanceTip: 'Сдача IELTS на 7.0+ и SAT на 1420+ автоматически переводит ваши заявки из очереди рассмотрения в приоритетный пул.',
      templateAvailable: true,
      subtasks: [
        { id: 'ex-1', title: profile.hasIelts ? `Подтвердить отправку официального TRF IELTS (${profile.ieltsScore}) в целевые университеты` : 'Зарегистрироваться на тест IELTS Academic и пройти 4 полных пробных теста (Mock)', isCompleted: profile.hasIelts },
        { id: 'ex-2', title: profile.hasSat ? `Проверить привязку аккаунта CollegeBoard к порталу вузов` : 'Сдать Digital SAT (целевой ориентир 1450+ для зарубежных грантов и NU)', isCompleted: profile.hasSat },
        { id: 'ex-3', title: profile.hasUnt ? `Сохранить электронный сертификат ЕНТ (${profile.untScore} баллов) с QR-кодом` : 'Зарегистрироваться на пробное тестирование Национального центра тестирования (ЕНТ)', isCompleted: profile.hasUnt },
      ]
    },
    {
      id: 'step-docs',
      title: 'Академический пакет документов и справки',
      category: 'documents',
      timeFrame: '1-2_months',
      targetDate: 'Ноябрь - Декабрь 2026',
      description: 'Сбор официальных транскриптов с оценками за 9–11 классы и справок для финансовой помощи.',
      isKeyMilestone: false,
      guidanceTip: 'Для итальянских и европейских стипендий (Bocconi ISU, EDISU) справки о доходах (2-НДФЛ) и состав семьи требуют апостиля и перевода — начните сбор заранее.',
      templateAvailable: true,
      subtasks: [
        { id: 'doc-1', title: 'Запросить в школьной канцелярии официальный транскрипт с печатью директора на двух языках (каз/рус и англ)', isCompleted: false },
        { id: 'doc-2', title: 'Получить подтвержденные рекомендации от 2 профильных учителей (математика/информатика + английский)', isCompleted: false },
        { id: 'doc-3', title: 'Собрать справки о доходах родителей (справка с места работы, форма 2-НДФЛ) для подачи на стипендии', isCompleted: false },
        { id: 'doc-4', title: 'Оцифровать грамоты и дипломы олимпиад в единый PDF-архив портфолио', isCompleted: profile.olympiadLevel !== 'none' }
      ]
    },
    {
      id: 'step-essay',
      title: 'Мотивационное эссе (Personal Statement & SOP)',
      category: 'essay',
      timeFrame: '1-2_months',
      targetDate: 'Декабрь 2026',
      description: 'Ключевой фактор дифференциации: почему именно эта специальность, чего вы хотите достичь и какую пользу принесете обществу.',
      isKeyMilestone: true,
      guidanceTip: 'Избегайте банальных фраз вроде "Я люблю программировать с детства". Покажите конкретную решенную проблему, проект или преодоленный вызов.',
      templateAvailable: true,
      subtasks: [
        { id: 'ess-1', title: 'Сформулировать личную "искру" (The Hook): личный опыт, вдохновивший на изучение ' + targetMajorTitle, isCompleted: false },
        { id: 'ess-2', title: 'Написать первый драфт эссе по структуре: Проблема -> Исследование -> Проект -> Почему именно этот вуз', isCompleted: false },
        { id: 'ess-3', title: 'Провести вычитку с ментором или носителем языка на логику и стиль', isCompleted: false }
      ]
    },
    {
      id: 'step-deadlines',
      title: 'Подача заявок на ранние дедлайны и гранты',
      category: 'deadlines',
      timeFrame: '3-6_months',
      targetDate: 'Январь - Март 2027',
      description: 'Отправка пакетов документов на платформы вузов (Common App, портал NU, Tempus Hungaricum, KAIST Portal).',
      isKeyMilestone: true,
      guidanceTip: 'Не ждите последнего дня дедлайна — серверы приемных комиссий часто перегружены за 6 часов до закрытия.',
      subtasks: [
        ...targetUniSubtasks,
        { id: 'dl-1', title: 'Подать заявку на грантовую программу Stipendium Hungaricum (дедлайн 15 января)', isCompleted: false },
        { id: 'dl-2', title: 'Завершить регистрацию в личных кабинетах абитуриента Nazarbayev University и KAIST', isCompleted: false },
        { id: 'dl-3', title: 'Подать финансовую заявку на стипендию ISU Bocconi / Financial Aid package', isCompleted: false }
      ]
    },
    {
      id: 'step-kz-grants',
      title: 'Конкурс государственных грантов РК (МНВО)',
      category: 'deadlines',
      timeFrame: 'final',
      targetDate: '13 - 20 июля 2027',
      description: 'Подача заявления на распределение образовательных грантов Республики Казахстан через портал eGov.',
      isKeyMilestone: true,
      guidanceTip: 'В списке из 4 вузов на грант ставьте первым приоритетом вуз вашей мечты (напр., AITU или SDU), вторым и третьим — надежные региональные и профильные вузы.',
      subtasks: [
        { id: 'kz-1', title: 'Сдать основную сессию ЕНТ (май - июнь) и получить финальный электронный сертификат', isCompleted: false },
        { id: 'kz-2', title: 'Выбрать 4 комбинации ВУЗ + образовательная программа для участия в конкурсе грантов', isCompleted: false },
        { id: 'kz-3', title: 'Подать заявку через eGov с ЭЦП в период 13–20 июля', isCompleted: false }
      ]
    }
  ];

  return steps;
}

// 4. Next Immediate Action Resolver
export function getNextAction(roadmap: RoadmapStep[]) {
  // Find the first uncompleted subtask in the roadmap
  for (const step of roadmap) {
    const uncompletedSubtask = step.subtasks.find(st => !st.isCompleted);
    if (uncompletedSubtask) {
      return {
        stepId: step.id,
        stepTitle: step.title,
        taskTitle: uncompletedSubtask.title,
        taskId: uncompletedSubtask.id,
        category: step.category,
        deadline: step.targetDate,
        guidanceTip: step.guidanceTip,
        totalTasks: step.subtasks.length,
        completedTasks: step.subtasks.filter(st => st.isCompleted).length,
      };
    }
  }

  // All completed
  return {
    stepId: 'completed',
    stepTitle: 'Все ключевые задачи выполнены!',
    taskTitle: 'Проверить почту приемных комиссий и ожидать официальных решений',
    taskId: 'finish',
    category: 'deadlines',
    deadline: 'Август 2027',
    guidanceTip: 'Поздравляем! Ваш маршрут полностью сформирован и запущен.',
    totalTasks: 1,
    completedTasks: 1,
  };
}
