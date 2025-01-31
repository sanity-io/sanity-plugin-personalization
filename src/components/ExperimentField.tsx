import {CloseIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'
import {GiSoapExperiment} from 'react-icons/gi'
import {
  defineDocumentFieldAction,
  DocumentFieldActionItem,
  DocumentFieldActionProps,
  FormPatch,
  ObjectFieldProps,
  PatchEvent,
  set,
  unset,
} from 'sanity'
type PatchStuff = {onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void; inputId: string}

const useAddExperimentAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {objectNameOverride: string; fieldNameOverride: string; active: boolean},
): DocumentFieldActionItem => {
  const {onChange, active} = props

  const handleAddAction = () => {
    // console.log('showing experiment', patchActiveTrueEvent)
    onChange([set(!active, ['active'])])
  }

  return {
    title: 'Add experiment',
    type: 'action',
    icon: GiSoapExperiment,
    onAction: handleAddAction,
    renderAsButton: true,
  }
}

const useRemoveExperimentAction = (
  props: DocumentFieldActionProps &
    PatchStuff & {objectNameOverride: string; fieldNameOverride: string; active: boolean},
): DocumentFieldActionItem => {
  const {onChange, active, fieldNameOverride, objectNameOverride} = props
  const patchActiveFalseEvent = () => {
    const activeId = ['active']
    return set(!active, activeId)
  }
  console.log(fieldNameOverride, objectNameOverride)
  const patchClearEvent = () => {
    const experimentId = [`${fieldNameOverride}Id`] // `${props.inputId}.experimentId`
    const variants = [objectNameOverride] //`${props.inputId}.variants`
    return [unset(experimentId), unset(variants)]
  }
  const handleClearAction = () => {
    // console.log('hiding experiment', patchActiveFalseEvent)
    const clearEvents = patchClearEvent()
    const activeEvent = patchActiveFalseEvent()
    onChange([activeEvent, ...clearEvents])
  }
  return {
    title: 'Remove experiment',
    type: 'action',
    icon: CloseIcon,
    onAction: handleClearAction,
    renderAsButton: true,
  }
}

const newActions = ({
  onChange,
  inputId,
  active,
  objectNameOverride,
  fieldNameOverride,
}: PatchStuff & {active?: boolean; objectNameOverride: string; fieldNameOverride: string}) => {
  const removeAction = defineDocumentFieldAction({
    name: 'Remove Experiment',
    useAction: (props) =>
      useRemoveExperimentAction({
        ...props,
        active: true,
        onChange,
        inputId,
        objectNameOverride,
        fieldNameOverride,
      }),
  })
  const addAction = defineDocumentFieldAction({
    name: 'Add Experiment',
    useAction: (props) =>
      useAddExperimentAction({
        ...props,
        active: false,
        onChange,
        inputId,
        objectNameOverride,
        fieldNameOverride,
      }),
  })
  if (active) {
    return removeAction
  }
  return addAction
}

export const ExperimentField = (
  props: ObjectFieldProps & {objectNameOverride: string; fieldNameOverride: string},
) => {
  const {onChange} = props.inputProps
  const {inputId, objectNameOverride, fieldNameOverride} = props
  const active = props.value?.active as boolean | undefined

  const oldActions = props.actions || []

  const withActionProps = {
    ...props,
    actions: [
      newActions({onChange, inputId, active, objectNameOverride, fieldNameOverride}),
      ...oldActions,
    ],
  }
  return props.renderDefault(withActionProps)
}
