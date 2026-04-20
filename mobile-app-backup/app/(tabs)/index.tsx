import React, { useState } from 'react';
import SearchProperties from '../../components/SearchProperties';
import {
  mapBudgetToEGP,
  mapInvestmentGoal,
  mapInvestmentStatus
} from '../../utils/userDataMapper';
import QuestionOne from '../QuestionOne';
import QuestionThree from '../QuestionThree';
import QuestionTwo from '../QuestionTwo';
import SignUp from '../SignUp';
import SplashScreen from '../SplashScreen';
import Welcome from '../Welcome';

export default function Index() {
  const [screen, setScreen] = useState('splash');
  const [userData, setUserData] = useState({
    name: 'User',
    investmentStatus: 'Getting started',
    investmentGoal: 'Long-term growth',
    budgetMin: 0,
    budgetMax: 100000000,
  });

  if (screen === 'splash') {
    return <SplashScreen onNext={() => setScreen('question1')} />;
  }

  if (screen === 'question1') {
    return <QuestionOne
      onNext={(data: any) => {
        const status = mapInvestmentStatus(data.investmentStatus);
        setUserData(prev => ({ ...prev, investmentStatus: status }));
        setScreen('question2');
      }}
    />;
  }

  if (screen === 'question2') {
    return <QuestionTwo
      onNext={(data: any) => {
        const budget = mapBudgetToEGP(data.budget);
        setUserData(prev => ({
          ...prev,
          budgetMin: budget.min,
          budgetMax: budget.max
        }));
        setScreen('question3');
      }}
      onBack={() => setScreen('question1')}
    />;
  }

  if (screen === 'question3') {
    return <QuestionThree
      onNext={(data: any) => {
        const goal = mapInvestmentGoal(data.investmentGoal);
        setUserData(prev => ({ ...prev, investmentGoal: goal }));
        setScreen('signup');
      }}
      onBack={() => setScreen('question2')}
    />;
  }

  if (screen === 'signup') {
    return <SignUp onNext={(data: any) => {
      setUserData(prev => ({ ...prev, name: data.name || 'User' }));
      setScreen('welcome');
    }} />;
  }

  if (screen === 'welcome') {
    return <Welcome
      userName={userData.name}
      onNext={() => setScreen('search')}
    />;
  }

  if (screen === 'search') {
    return <SearchProperties
      navigation={undefined}
      route={{ params: { userData } }}
    />;
  }

  return null;
}