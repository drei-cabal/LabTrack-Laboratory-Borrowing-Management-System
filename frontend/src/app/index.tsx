import React from 'react';
import { Redirect } from 'expo-router';
import { ROUTES } from '../routing/routes';

export default function IndexScreen() {
  return <Redirect href={ROUTES.LOGIN} />;
}
