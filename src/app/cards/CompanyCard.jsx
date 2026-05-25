import React, { useState } from 'react';
import {
  hubspot,
  Text,
  Flex,
  Divider,
  LoadingSpinner,
  Alert,
  Button
} from '@hubspot/ui-extensions';
import {
  APP_ORIGIN,
  getCompanySearchContext,
  researchCompany
} from './lib/companyResearch';
import { ResearchSections } from './lib/ResearchResults';

hubspot.extend(({ context }) => <CompanyCard context={context} />);

function CompanyCard({ context }) {
  const props = context?.crm?.object?.properties || {};
  const { query, label } = getCompanySearchContext(props);
  const [state, setState] = useState({
    loading: false,
    researched: false,
    data: null,
    error: null
  });

  async function handleResearch() {
    if (!query) {
      setState({
        loading: false,
        researched: false,
        data: null,
        error: 'Add a company domain or name to search Hi Energy AI.'
      });
      return;
    }

    setState({ loading: true, researched: false, data: null, error: null });

    try {
      const result = await researchCompany(props, context?.portal?.id);

      if (!result.ok) {
        setState({
          loading: false,
          researched: false,
          data: null,
          error: result.message
        });
        return;
      }

      setState({ loading: false, researched: true, data: result, error: null });
    } catch (err) {
      setState({
        loading: false,
        researched: false,
        data: null,
        error: String(err.message || err)
      });
    }
  }

  if (state.loading) {
    return <LoadingSpinner label="Researching in Hi Energy AI…" />;
  }

  if (state.error) {
    return (
      <Flex direction="column" gap="md">
        <Alert title="Hi Energy AI" variant="warning">
          {state.error}
        </Alert>
        <Button variant="primary" onClick={handleResearch} disabled={!query}>
          Research company
        </Button>
        <Button href={{ url: `${APP_ORIGIN}/api_documentation/api_key`, external: true }}>
          Get Hi Energy API key
        </Button>
      </Flex>
    );
  }

  if (!state.researched) {
    return (
      <Flex direction="column" gap="md">
        <Text variant="microcopy">{label}</Text>
        <Text>
          Search Hi Energy AI for advertisers, deals, and contacts linked to this company.
        </Text>
        <Button variant="primary" onClick={handleResearch} disabled={!query}>
          Research company
        </Button>
      </Flex>
    );
  }

  const sections = state.data?.sections || [];

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">{label}</Text>
      <ResearchSections
        sections={sections}
        emptyMessage="No Hi Energy matches for this company."
      />
      <Divider />
      <Flex direction="row" gap="sm">
        <Button variant="secondary" onClick={handleResearch}>
          Research again
        </Button>
        <Button href={{ url: APP_ORIGIN, external: true }}>Open Hi Energy AI</Button>
      </Flex>
    </Flex>
  );
}
