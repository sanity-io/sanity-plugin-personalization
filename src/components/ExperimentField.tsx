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
type PatchStuff = {patch: Operation<[patches: any][]>; activeId: string}

const useAddExperimentAction = (
  props: DocumentFieldActionProps & PatchStuff,
): DocumentFieldActionItem => {
  const patchEvent = useMemo(() => {
    return {
      set: {[props.activeId]: true},
    }
  }, [props])
  const handleAction = useCallback(() => {
    props.patch.execute([patchEvent])
  }, [patchEvent, props.patch])

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
  const patchEvent = useMemo(() => {
    return {
      set: {[props.activeId]: false},
    }
  }, [props])
  const handleAction = useCallback(() => {
    props.patch.execute([patchEvent])
  }, [patchEvent, props.patch])

  return {
    title: 'Remove experiment',
    type: 'action',
    icon: CloseIcon,
    onAction: handleAction,
    renderAsButton: true,
  }
}

const newActions = ({patch, activeId, active}: PatchStuff & {active?: boolean}) =>
  active
    ? defineDocumentFieldAction({
        name: 'Experiment',
        useAction: (props) => useRemoveExperimentAction({...props, patch, activeId}),
      })
    : defineDocumentFieldAction({
        name: 'Experiment',
        useAction: (props) => useAddExperimentAction({...props, patch, activeId}),
      })

export const Experimentfield = (props: ObjectFieldProps) => {
  const id = useFormValue(['_id']) as string
  const {patch} = useDocumentOperation(id.replace('drafts.', ''), props.schemaType.name)
  const activeId = `${props.inputId}.active`
  const active = props.value?.active as boolean | undefined

  const oldActions = props.actions || []

  const wihtActionProps = {
    ...props,
    actions: [newActions({patch, activeId, active}), ...oldActions],
  }
  return props.renderDefault(wihtActionProps)
}
