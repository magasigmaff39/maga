import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1Home } from './components/Step1Home';
import { LandingPage } from './components/landing/LandingPage';
import { Step2Profile } from './components/Step2Profile';
import { Step3Diagnostic } from './components/Step3Diagnostic';
import { Step4Recommendations } from './components/Step4Recommendations';
import { Step5Comparison } from './components/Step5Comparison';
import { Step6Roadmap } from './components/Step6Roadmap';
import { Step7NextAction } from './components/Step7NextAction';
import { EssayArchitectModal } from './components/EssayArchitectModal';
import { DeadlineCalendarModal } from './components/DeadlineCalendarModal';
import { AuthModal, type AuthMode } from './components/AuthModal';
import { EmailDeliveryModal } from './components/EmailDeliveryModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { TasksModal } from './components/TasksModal';
import { DocumentsModal } from './components/DocumentsModal';
import { PortfolioModal } from './components/PortfolioModal';
import { OlympiadsModal } from './components/OlympiadsModal';
import { getActiveUser, logoutUser, refreshSession, finishGoogleRedirect, UserAccount } from './lib/auth';
import { authApi, setUiState } from './lib/api';
import { useI18n } from './i18n/I18nContext';
import { useToast } from './context/ToastContext';

import { ApplicantProfile, PortfolioItemInput, RoadmapStep } from './types';
import { PRESET_PERSONAS } from './data/presets';
import { UNIVERSITY_DATABASE } from './data/universities';
import { pickTargetUniversities } from '../shared/logic/match.js';
import {
  runDiagnostic,
  matchUniversities,
  generateRoadmap,
  getNextAction
} from './utils/engine';

const DEFAULT_PROFILE: ApplicantProfile = PRESET_PERSONAS[0].profile;

export function App() {
  const { t, lang } = useI18n();
  const { notify } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const openAuth = (mode: AuthMode = 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState<boolean>(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState<boolean>(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState<boolean>(false);
  const [isOlympiadsModalOpen, setIsOlympiadsModalOpen] = useState<boolean>(false);
  const [portfolioDraft, setPortfolioDraft] = useState<Partial<PortfolioItemInput> | null>(null);

  const [profile, setProfile] = useState<ApplicantProfile>(() => {
    try {
      const saved = localStorage.getItem('admitroute_profile');
      const parsed = saved ? JSON.parse(saved) : {};
      const base = { ...DEFAULT_PROFILE, ...parsed, extracurriculars: parsed.extracurriculars || DEFAULT_PROFILE.extracurriculars, targetUniversityIds: parsed.targetUniversityIds || DEFAULT_PROFILE.targetUniversityIds };
      const user = getActiveUser();
      if (user) {
        return {
          ...base,
          name: `${user.firstName} ${user.lastName}`.trim(),
          age: user.age,
          grade: user.grade,
        };
      }
      return base;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // The comparison starts from the universities the engine picks for this profile, not a fixed trio.
  const autoCompareIds = (p: ApplicantProfile) => {
    const picks = pickTargetUniversities(p, UNIVERSITY_DATABASE, { limit: 3 }).map((u) => u.id);
    return picks.length >= 2 ? picks : ['nu', 'aitu', 'kaist'];
  };
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(() => autoCompareIds(profile));

  const [isEssayModalOpen, setIsEssayModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  // Validate the cached session against the backend once (or finish a redirect-based Google sign-in),
  // and pull the server-side profile if newer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user: UserAccount | null = null;
      try {
        user = await finishGoogleRedirect(lang);
        if (user && !cancelled) notify(`${t('auth.toast.welcome')}, ${user.firstName}`, 'success');
      } catch {
        user = null;
      }
      if (!user) user = await refreshSession();
      if (cancelled) return;
      setCurrentUser(user);
      if (user) {
        try {
          const remote = await authApi.getProfile();
          if (!cancelled && remote.profile) {
            const localUpdated = Number(localStorage.getItem('admitroute_profile_updated') || 0);
            if (!localUpdated || Date.parse(remote.updatedAt || '') > localUpdated) {
              setProfile((prev) => ({ ...prev, ...remote.profile }));
            }
          }
        } catch {
          /* backend offline — keep local */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist locally always; sync to the server (debounced) when logged in.
  const syncTimer = useRef<number | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem('admitroute_profile', JSON.stringify(profile));
      localStorage.setItem('admitroute_profile_updated', String(Date.now()));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
    if (!currentUser) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      authApi.saveProfile(profile).catch(() => undefined);
    }, 1200);
    return () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [profile, currentUser]);

  const handleProfileChange = (updated: ApplicantProfile) => {
    setProfile(updated);
    if (updated.targetUniversityIds?.length >= 2) {
      setSelectedForCompare(updated.targetUniversityIds);
    }
  };

  const diagnostic = useMemo(() => runDiagnostic(profile), [profile]);
  const matchedUniversities = useMemo(() => matchUniversities(profile), [profile]);

  const [roadmap, setRoadmap] = useState<RoadmapStep[]>(() => {
    return generateRoadmap(profile, matchedUniversities);
  });

  useEffect(() => {
    setRoadmap(prevRoadmap => {
      const freshSteps = generateRoadmap(profile, matchedUniversities);
      return freshSteps.map(fresh => {
        const matchingPrev = prevRoadmap.find(p => p.id === fresh.id);
        if (!matchingPrev) return fresh;
        return {
          ...fresh,
          subtasks: fresh.subtasks.map(fst => {
            const prevSub = matchingPrev.subtasks.find(pst => pst.id === fst.id);
            return prevSub ? { ...fst, isCompleted: prevSub.isCompleted } : fst;
          })
        };
      });
    });
  }, [profile, matchedUniversities]);

  useEffect(() => {
    const total = roadmap.reduce((n, s) => n + s.subtasks.length, 0);
    const done = roadmap.reduce((n, s) => n + s.subtasks.filter((x) => x.isCompleted).length, 0);
    setUiState({ step: currentStep, selectedForCompare, roadmapDone: total ? `${done}/${total}` : undefined, language: lang });
  }, [currentStep, selectedForCompare, roadmap, lang]);

  const nextAction = useMemo(() => getNextAction(roadmap), [roadmap]);
  const activeRoadmapStep = useMemo(() => {
    return roadmap.find(s => s.id === nextAction.stepId) || roadmap[0];
  }, [roadmap, nextAction]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (user: UserAccount, isNew?: boolean) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    void isNew;
    // Prefer the profile stored on the server for this account (multi-device); otherwise keep local edits.
    let remoteProfile: Partial<ApplicantProfile> | null = null;
    try {
      remoteProfile = (await authApi.getProfile()).profile;
    } catch {
      /* ignore */
    }
    setProfile(prev => ({
      ...prev,
      ...(remoteProfile || {}),
      name: `${user.firstName} ${user.lastName}`.trim(),
      age: user.age,
      grade: user.grade,
    }));
    goToStep(2);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentStep(1);
    setMaxReachedStep(1);
    window.scrollTo({ top: 0 });
  };

  const handleReset = () => {
    setProfile(
      currentUser
        ? { ...DEFAULT_PROFILE, name: `${currentUser.firstName} ${currentUser.lastName}`.trim(), age: currentUser.age, grade: currentUser.grade }
        : DEFAULT_PROFILE,
    );
    setCurrentStep(1);
    setMaxReachedStep(1);
    setSelectedForCompare(autoCompareIds(DEFAULT_PROFILE));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (uniId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(uniId)) {
        return prev.length > 2 ? prev.filter(id => id !== uniId) : prev;
      } else {
        return [...prev, uniId];
      }
    });
  };

  const handleToggleSubtask = (stepId: string, subtaskId: string) => {
    setRoadmap(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      return {
        ...step,
        subtasks: step.subtasks.map(task => {
          if (task.id !== subtaskId) return task;
          return { ...task, isCompleted: !task.isCompleted };
        })
      };
    }));
  };

  const handleExportRoadmap = () => {
    let content = `ПЕРСОНАЛЬНЫЙ МАРШРУТ ПОСТУПЛЕНИЯ В УНИВЕРСИТЕТ\r\n`;
    content += `Платформа: AdmitRoute\r\n`;
    content += `Кандидат: ${profile.name || 'Абитуриент'} (${profile.grade}, ${profile.schoolType.toUpperCase()})\r\n`;
    content += `GPA: ${profile.gpa} | Язык: IELTS ${profile.ieltsScore || '—'} | SAT: ${profile.satScore || '—'} | ЕНТ: ${profile.untScore || '—'}\r\n`;
    content += `Финансирование: ${profile.budgetTier === 'grant_only' ? 'Только 100% грант' : profile.budgetTier}\r\n`;
    content += `Дата формирования: ${new Date().toLocaleDateString('ru-RU')}\r\n\r\n`;
    content += `========================================================\r\n\r\n`;

    roadmap.forEach((step, idx) => {
      content += `ЭТАП ${idx + 1}: ${step.title.toUpperCase()}\r\n`;
      content += `Срок: ${step.targetDate} [Категория: ${step.category}]\r\n`;
      content += `Описание: ${step.description}\r\n`;
      content += `Рекомендация: ${step.guidanceTip}\r\n`;
      content += `Контрольные действия:\r\n`;
      step.subtasks.forEach(st => {
        content += `  [${st.isCompleted ? 'X' : ' '}] ${st.title}\r\n`;
      });
      content += `\r\n--------------------------------------------------------\r\n\r\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `admitroute_plan_${profile.name || 'applicant'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Title page: everything behind it stays locked until the applicant registers or logs in.
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans overflow-x-hidden transition-colors duration-300">
        <Header
          currentStep={1}
          currentUser={null}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
          onReset={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onOpenEssayModal={() => openAuth('login')}
          onOpenCalendarModal={() => openAuth('login')}
          onOpenEmailModal={() => openAuth('login')}
          onOpenTasksModal={() => openAuth('login')}
          onOpenDocumentsModal={() => openAuth('login')}
          onOpenPortfolioModal={() => openAuth('login')}
          onOpenOlympiadsModal={() => openAuth('login')}
        />
        <main className="flex-1">
          <LandingPage onRegister={() => openAuth('register')} onLogin={() => openAuth('login')} />
        </main>
        <AuthModal isOpen={isAuthModalOpen} initialMode={authMode} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans overflow-x-hidden transition-colors duration-300">

      {/* Top Header */}
      <Header
        currentStep={currentStep}
        currentUser={currentUser}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
        onReset={handleReset}
        onOpenEssayModal={() => setIsEssayModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenTasksModal={() => setIsTasksModalOpen(true)}
        onOpenDocumentsModal={() => setIsDocumentsModalOpen(true)}
        onOpenPortfolioModal={() => setIsPortfolioModalOpen(true)}
        onOpenOlympiadsModal={() => setIsOlympiadsModalOpen(true)}
      />

      {/* Stepper (Stages 1-7) */}
      <Stepper
        currentStep={currentStep}
        onStepClick={goToStep}
        maxReachedStep={maxReachedStep}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Step 1: Cabinet home */}
        {currentStep === 1 && (
          <Step1Home
            currentUser={currentUser}
            profile={profile}
            diagnostic={diagnostic}
            roadmap={roadmap}
            maxReachedStep={maxReachedStep}
            nextAction={nextAction}
            onGoToStep={goToStep}
            onOpenTasksModal={() => setIsTasksModalOpen(true)}
            onOpenDocumentsModal={() => setIsDocumentsModalOpen(true)}
            onOpenPortfolioModal={() => setIsPortfolioModalOpen(true)}
            onOpenOlympiadsModal={() => setIsOlympiadsModalOpen(true)}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            onOpenEssayModal={() => setIsEssayModalOpen(true)}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
          />
        )}

        {/* Step 2: Profile Questionnaire */}
        {currentStep === 2 && (
          <Step2Profile
            profile={profile}
            onChangeProfile={handleProfileChange}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        )}

        {/* Step 3: Diagnostic Report */}
        {currentStep === 3 && (
          <Step3Diagnostic
            profile={profile}
            diagnostic={diagnostic}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )}

        {/* Step 4: Recommendations */}
        {currentStep === 4 && (
          <Step4Recommendations
            universities={matchedUniversities}
            profile={profile}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {/* Step 5: Comparison Matrix */}
        {currentStep === 5 && (
          <Step5Comparison
            allUniversities={matchedUniversities}
            selectedIds={selectedForCompare}
            onToggleUni={handleToggleCompare}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
            profile={profile}
            isAuthenticated={Boolean(currentUser)}
          />
        )}

        {/* Step 6: Personal Roadmap */}
        {currentStep === 6 && (
          <Step6Roadmap
            roadmap={roadmap}
            onToggleSubtask={handleToggleSubtask}
            onNext={() => goToStep(7)}
            onBack={() => goToStep(5)}
            onExportRoadmap={handleExportRoadmap}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
          />
        )}

        {/* Step 7: Next Immediate Action */}
        {currentStep === 7 && (
          <Step7NextAction
            currentStepData={nextAction}
            activeRoadmapStep={activeRoadmapStep}
            onToggleSubtask={handleToggleSubtask}
            onBack={() => goToStep(6)}
            onRestart={() => goToStep(1)}
            onOpenEssayModal={() => setIsEssayModalOpen(true)}
            onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            onOpenEmailModal={() => setIsEmailModalOpen(true)}
          />
        )}

      </main>

      {/* Clean Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 py-8 mt-12 text-xs text-slate-500 dark:text-zinc-400 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-extrabold text-slate-800 dark:text-white text-sm">AdmitRoute</div>
          <div>{t('header.tagline')} · {currentUser.gmail}</div>
        </div>
      </footer>

      {/* Auxiliary Modals */}
      <EssayArchitectModal
        isOpen={isEssayModalOpen}
        onClose={() => setIsEssayModalOpen(false)}
        profile={profile}
      />

      <DeadlineCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Registration & Login Modal (backend sessions) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Email delivery of the roadmap */}
      <EmailDeliveryModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        userEmail={currentUser?.gmail || ''}
        studentName={profile.name || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Абитуриент')}
        readinessScore={diagnostic.readiness.overall}
        roadmap={roadmap}
        matchedUnis={matchedUniversities}
      />

      {/* Tasks with deadlines (SAT / IELTS / UNT / documents) */}
      <TasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        isAuthenticated={Boolean(currentUser)}
        onOpenAuth={() => openAuth('login')}
        profile={profile}
      />

      {/* Admission documents checklist & uploads */}
      <DocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
        isAuthenticated={Boolean(currentUser)}
        onOpenAuth={() => openAuth('login')}
        profile={profile}
      />

      {/* Portfolio: achievements + AI evaluation for a field and target universities */}
      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        isAuthenticated={Boolean(currentUser)}
        onOpenAuth={() => openAuth('login')}
        profile={profile}
        selectedForCompare={selectedForCompare}
        draft={portfolioDraft}
        onDraftConsumed={() => setPortfolioDraft(null)}
      />

      {/* Olympiads & competitions catalogue with personal recommendations */}
      <OlympiadsModal
        isOpen={isOlympiadsModalOpen}
        onClose={() => setIsOlympiadsModalOpen(false)}
        isAuthenticated={Boolean(currentUser)}
        onOpenAuth={() => openAuth('login')}
        profile={profile}
        onAddToPortfolio={(draft) => {
          setPortfolioDraft(draft);
          setIsOlympiadsModalOpen(false);
          setIsPortfolioModalOpen(true);
        }}
      />

      <AIAssistantWidget profile={profile} isAuthenticated={Boolean(currentUser)} />

    </div>
  );
}

export default App;
