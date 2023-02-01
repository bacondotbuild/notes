import type { ChangeEvent, SyntheticEvent } from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'

import type { Values } from '@/lib/types'

const isObject = (a: Values) => typeof a === 'object' && a !== null
const isEqual = (a: Values, b: Values) =>
  isObject(a) && isObject(b) && Object.keys(a).every(key => a[key] === b[key])
const isEmpty = (obj: Values | Partial<Values>) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

const useForm = ({
  onSubmit,
  validate,
  initialValues,
}: {
  onSubmit: (
    values: Values,
    helpers: {
      setSubmitting: (a: boolean) => void
      setErrors: (errors: Partial<Values>) => void
    }
  ) => void
  validate?: (values: Values) => Partial<Values>
  initialValues: Values
}) => {
  const initialValuesRef = useRef(initialValues)
  const initialErrors = {}
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<Values>>({})
  const [isSubmitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEqual(initialValuesRef.current, initialValues)) {
      initialValuesRef.current = initialValues
      setValues({
        ...initialValues,
      })
    }
  }, [initialValues])

  const dirty = useMemo(
    () => !isEqual(initialValuesRef.current, values),
    [values]
  )

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.currentTarget
    setValues({
      ...values,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    })
  }

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const newErrors = validate ? validate(values) : initialErrors
    if (!isEmpty(newErrors)) {
      setErrors(newErrors)
      setSubmitting(false)
    } else {
      setErrors(initialErrors)
      onSubmit(values, { setSubmitting, setErrors })
      setValues(initialValuesRef.current)
    }
  }

  return {
    values,
    handleChange,
    handleSubmit,
    isSubmitting,
    dirty,
    errors,
  }
}

export default useForm
