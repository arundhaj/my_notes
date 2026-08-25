import { Container, Text, Title } from '@mantine/core'

function App() {
  return (
    <Container size="sm" pt="xl">
      <Title order={1}>Hello World</Title>
      <Text c="dimmed" mt="sm">
        notes_web is running on React and Mantine.
      </Text>
    </Container>
  )
}

export default App
