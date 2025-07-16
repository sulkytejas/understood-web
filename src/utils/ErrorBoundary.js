import React from 'react';
import * as Sentry from '@sentry/react';
import { feedbackIntegration } from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  componentDidCatch(error) {
    // 1) Capture the exception in Sentry, which returns an eventId
    const eventId = Sentry.captureException(error);

    // 2) Mark state so we can show a fallback UI if desired
    this.setState({ hasError: true, eventId });

    // 3) Open the same Sentry feedback form automatically
    const feedback = feedbackIntegration({ autoInject: false });
    feedback.openDialog({
      eventId,
      formTitle: 'Oops! An error occurred',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelSubmit: 'Send',
    });
  }

  render() {
    if (this.state.hasError) {
      // Optionally show a fallback UI behind the Sentry feedback form
      return <h2>Something went wrong</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
