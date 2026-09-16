import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1Landing } from './components/Step1Landing';
import { Step2Profile } from './components/Step2Profile';
import { Step3Diagnostic } from './components/Step3Diagnostic';
import { Step4Recommendations } from './components/Step4Recommendations';
import { Step5Comparison } from './components/Step5Comparison';
import { Step6Roadmap } from './components/Step6Roadmap';
import { Step7NextAction } from './components/Step7NextAction';
import { EssayArchitectModal } from './components/EssayArchitectModal';
import { DeadlineCalendarModal } from './components/DeadlineCalendarModal';
import { AuthModal } from './components/AuthModal';
import { EmailDeliveryModal } from './components/EmailDeliveryModal';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { getActiveUser, logoutUser, UserAccount } from './lib/firebase';

import { ApplicantProfile, RoadmapStep } from './types';
import { PRESET_PERSONAS } from './data/presets';
import { 
  runDiagnostic, 
  matchUniversities, 
  generateRoadmap, 
  getNextAction 
} from './utils/engine';

const DEFAULT_PROFILE: ApplicantProfile = PRESET_PERSONAS[0].profile;

export function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getActiveUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

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

  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(['nu', 'aitu', 'kaist']);

  const [isEssayModalOpen, setIsEssayModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('admitroute_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [profile]);

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

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setProfile(prev => ({
      ...prev,
      name: `${user.firstName} ${user.lastName}`.trim(),
      age: user.age,
      grade: user.grade,
    }));
    goToStep(2);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  const handleReset = () => {
    setProfile(DEFAULT_PROFILE);
    setCurrentStep(1);
    setMaxReachedStep(1);
    setSelectedForCompare(['nu', 'aitu', 'kaist']);
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

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans overflow-x-hidden transition-colors duration-300">
      
      {/* Top Header */}
      <Header
        currentStep={currentStep}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onReset={handleReset}
        onOpenEssayModal={() => setIsEssayModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
      />

      {/* Stepper (Stages 1-7) — Hidden on Step 1 (Landing) as requested */}
      {currentStep > 1 && (
        <Stepper
          currentStep={currentStep}
          onStepClick={goToStep}
          maxReachedStep={maxReachedStep}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${currentStep === 1 ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
        
        {/* Step 1: Landing */}
        {currentStep === 1 && (
          <Step1Landing
            onStartCustom={() => goToStep(2)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            currentUser={currentUser}
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
          <div>Платформа академической навигации · SaaS для абитуриентов</div>
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

      {/* Registration & Login Modal (Firebase Auth + Firestore) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Official Google SMTP Delivery Modal */}
      <EmailDeliveryModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        userEmail={currentUser?.gmail || ''}
        studentName={profile.name || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Абитуриент')}
        readinessScore={diagnostic.readiness.overall}
        roadmap={roadmap}
        matchedUnis={matchedUniversities}
      />

      <AIAssistantWidget />

    </div>
  );
}

export default App;
