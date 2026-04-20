import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to trips list for quicker access during development
  return <Redirect href="/trips" />;
}
