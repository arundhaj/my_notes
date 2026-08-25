import { Container, Typography } from '@mui/material'

function App() {
  return (
    <Container maxWidth="sm" sx={{ pt: 6 }}>
      <Typography variant="h3" component="h1">
        Hello World!!!
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        notes_web is running on React and MUI.
      </Typography>
    </Container>
  )
}

export default App
