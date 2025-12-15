import { useState } from 'react'

import SignIn from '@/components/auth/SignIn'
import SignUp from '@/components/auth/SignUp'

export default function Auth() {
  const [selected, setSelected] = useState('signIn')

  return selected === 'signIn' ? (
    <SignIn setSelected={setSelected} />
  ) : (
    <SignUp setSelected={setSelected} />
  )
}
