export const validateItemForm = (formData) => {
    const errors = {}

    if (!formData.title.trim()) {
        errors.title = 'Please enter a title.'
    } else if (formData.title.trim().length > 100) {
        errors.title = 'The title must be 100 characters or fewer.'
    }

    if (!formData.description.trim()) {
        errors.description = 'Please enter a description.'
    } else if (formData.description.trim().length > 500) {
        errors.description =
            'The description must be 500 characters or fewer.'
    }

    if (!formData.categoryId) {
        errors.categoryId = 'Please select a category.'
    }

    if (!formData.condition) {
        errors.condition = 'Please select a condition.'
    }

    return errors
}