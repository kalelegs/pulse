import { TSessionContext } from '@/types';

export const useCustomerContext = (): TSessionContext => {
  // replace with actual logic of getting user context
  return {
    userName: 'Gaurav',
    preferences: [
      'Likes hiking',
      'Often buys hiking gear',
      'Has done some extreme hikes like half dome',
      'likes building high performance server systems',
      'often buys computer parts such as cpu, memory, SSDs',
    ],
  };
};
