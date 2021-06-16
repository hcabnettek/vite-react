// eslint-disable-next-line no-use-before-define
import React, { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Diagram from './pages/Diagram'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { OptionalObjectSchema, TypeOfShape } from 'yup/lib/object'
import { RequiredStringSchema } from 'yup/lib/string'
import { RequiredNumberSchema } from 'yup/lib/number'
import { RequiredBooleanSchema } from 'yup/lib/boolean'

import { db, Contact } from './db'

type ProjectType = {
  firstName: RequiredStringSchema<string | undefined, Record<string, any>>
  lastName: RequiredStringSchema<string | undefined, Record<string, any>>
  middleName: RequiredStringSchema<string | undefined, Record<string, any>>
  agreed: RequiredBooleanSchema<boolean | undefined, Record<string, any>>
  power: RequiredNumberSchema<number | undefined, Record<string, any>>
}

const useYupValidationResolver = (
  validationSchema: OptionalObjectSchema<ProjectType, Record<string, any>, TypeOfShape<ProjectType>>,
) =>
  useCallback(
    async data => {
      try {
        const values = await validationSchema.validate(data, {
          abortEarly: false,
        })

        return {
          values,
          errors: {},
        }
      } catch (errors) {
        return {
          values: {},
          errors: errors.inner.reduce(
            (allErrors: any, currentError: { path: any; type: any; message: any }) => ({
              ...allErrors,
              [currentError.path]: {
                type: currentError.type ?? 'validation',
                message: currentError.message,
              },
            }),
            {},
          ),
        }
      }
    },
    [validationSchema],
  )

const validationSchema = yup.object({
  firstName: yup.string().required('Required'),
  lastName: yup.string().required('Required'),
  //middleName: yup.string().required('Required'),
  //agreed: yup.bool().required('Required'),
  //power: yup.number().required('Required').max(10, 'Less than 10 bitch!'),
})

const validHandler: SubmitHandler<ProjectType> = (project: ProjectType) => {
  console.log(project)
}

const invalidHandler: SubmitErrorHandler<Contact> = (errors, event) => {
  for (const [err, errValue] of Object.entries(errors)) {
    const map = errValue as { message: string }
    console.error(err, map?.message)
  }
}

async function seedDatabase() {
  await Promise.all([db.contacts.clear(), db.emails.clear(), db.phones.clear()]);
  console.log("Seeding database with some contacts...");
  await db.transaction('rw', db.contacts, db.emails, db.phones, async function () {
      // Populate a contact
      let arnoldId = await db.contacts.add(new Contact('Arnold', 'Fitzgerald'));

      // Populate some emails and phone numbers for the contact
      db.emails.add({ contactId: arnoldId, type: 'home', email: 'arnold@email.com' });
      db.emails.add({ contactId: arnoldId, type: 'work', email: 'arnold@abc.com' });
      db.phones.add({ contactId: arnoldId, type: 'home', phone: '12345678' });
      db.phones.add({ contactId: arnoldId, type: 'work', phone: '987654321' });

      // ... and another one...
      let adamId = await db.contacts.add(new Contact('Adam', 'Tensta'));
      // Populate some emails and phone numbers for the contact
      db.emails.add({ contactId: adamId, type: 'home', email: 'adam@tensta.se' });
      db.phones.add({ contactId: adamId, type: 'work', phone: '88888888' });
  });
}

function Form1() {
  
  const addItemToDb: SubmitHandler<Contact> = async (contact: Contact) => {
    console.log('')
    await db.transaction('rw', db.contacts, db.emails, db.phones, async function () {
      const { firstName, lastName } = contact;
      let id = await db.contacts.add(new Contact(firstName, lastName));
    })
  }

  const resolver = useYupValidationResolver(validationSchema)
  const [agreement, setAgreement] = useState<string>('You have not agreed!')
  const { handleSubmit, register } = useForm<Contact>({ resolver })
  //const allItems = useLiveQuery(() => db.getMany(), [])
  //if (!allItems) return null

  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(addItemToDb, invalidHandler)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="firstName" className="sr-only">
                First Name
              </label>
              <input
                id="firstName"
                {...register('firstName')}
                name="firstName"
                type="text"
                autoComplete="firstName"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Last Name
              </label>
              <input
                id="lastName"
                {...register('lastName')}
                name="lastName"
                type="text"
                autoComplete="lastName"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
              />
            </div>
         </div>
          <input
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          />
        </form>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/">
          <Diagram />
        </Route>
        <Route exact path="/form1">
          <Form1 />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

export default App
