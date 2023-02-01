import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const reorder = <T,>(list: T[], startIndex: number, endIndex: number) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  if (removed) result.splice(endIndex, 0, removed)

  return result
}

interface DragDropListItemType {
  id: string
}

export default function DragDropList<T extends DragDropListItemType>({
  items,
  setItems,
  renderItem,
  itemContainerClassName,
  listContainerClassName,
}: {
  items: Array<T>
  setItems: (items: Array<T>) => void
  renderItem: (item: T, index: number) => React.ReactNode
  itemContainerClassName?: string | (() => string)
  listContainerClassName?: string
}) {
  return (
    <DragDropContext
      onDragStart={() => {
        if (window.navigator.vibrate) {
          window.navigator.vibrate(100)
        }
      }}
      onDragEnd={result => {
        // combining item
        if (result.combine) {
          // super simple: just removing the dragging item
          const newItems: T[] = [...items]
          newItems.splice(result.source.index, 1)
          setItems(newItems)
          return
        }

        // dropped outside the list
        if (!result.destination) {
          return
        }

        if (result.destination.index === result.source.index) {
          return
        }

        const newItems = reorder(
          items,
          result.source.index,
          result.destination.index
        )

        setItems(newItems)
      }}
    >
      <Droppable droppableId='droppable'>
        {dropProvided => (
          <div
            {...dropProvided.droppableProps}
            ref={dropProvided.innerRef}
            className={listContainerClassName}
          >
            {items.map((item, index) => {
              return (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {provided => {
                    return (
                      <div
                        className={
                          typeof itemContainerClassName === 'string'
                            ? itemContainerClassName
                            : itemContainerClassName
                            ? itemContainerClassName()
                            : undefined
                        }
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {renderItem(item, index)}
                      </div>
                    )
                  }}
                </Draggable>
              )
            })}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
