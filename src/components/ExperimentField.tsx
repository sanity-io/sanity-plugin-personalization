import {AddIcon, CloseIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {
  defineDocumentFieldAction,
  DocumentFieldActionItem,
  DocumentFieldActionProps,
  ObjectFieldProps,
  Operation,
  useDocumentOperation,
  useFormValue,
} from 'sanity'
type PatchStuff = {patch: Operation<[patches: any[]]>; inputId: string}

const useAddExperimentAction = (
  props: DocumentFieldActionProps & PatchStuff,
): DocumentFieldActionItem => {
  const patchActiveEvent = useMemo(() => {
    const activeId = `${props.inputId}.active`
    return {
      set: {[activeId]: true},
    }
  }, [props])
  const handleAction = useCallback(() => {
    props.patch.execute([patchActiveEvent])
  }, [patchActiveEvent, props.patch])

  return {
    title: 'Add experiment',
    type: 'action',
    icon: AddIcon,
    onAction: handleAction,
    renderAsButton: true,
  }
}

const useRemoveExperimentAction = (
  props: DocumentFieldActionProps & PatchStuff,
): DocumentFieldActionItem => {
  const patchActiveEvent = useMemo(() => {
    const activeId = `${props.inputId}.active`
    return {
      set: {[activeId]: false},
    }
  }, [props])

  const patchClearEvent = useMemo(() => {
    const experimentId = `${props.inputId}.experimentId`
    const variants = `${props.inputId}.variants`
    return {
      unset: [experimentId, variants],
    }
  }, [props])
  const handleAction = useCallback(() => {
    props.patch.execute([patchActiveEvent, patchClearEvent])
  }, [patchActiveEvent, patchClearEvent, props.patch])

  return {
    title: 'Remove experiment',
    type: 'action',
    icon: CloseIcon,
    onAction: handleAction,
    renderAsButton: true,
  }
}

const newActions = ({patch, inputId, active}: PatchStuff & {active?: boolean}) =>
  active
    ? defineDocumentFieldAction({
        name: 'Experiment',
        useAction: (props) => useRemoveExperimentAction({...props, patch, inputId}),
      })
    : defineDocumentFieldAction({
        name: 'Experiment',
        useAction: (props) => useAddExperimentAction({...props, patch, inputId}),
      })

export const Experimentfield = (props: ObjectFieldProps) => {
  const id = useFormValue(['_id']) as string
  const {patch} = useDocumentOperation(id.replace('drafts.', ''), props.schemaType.name)
  const {inputId} = props
  const active = props.value?.active as boolean | undefined

  const oldActions = props.actions || []

  const wihtActionProps = {
    ...props,
    actions: [newActions({patch, inputId, active}), ...oldActions],
  }
  return props.renderDefault(wihtActionProps)
}
