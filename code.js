figma.showUI(__html__, { width: 320, height: 420 });

const INPUT_COMPONENTS = {
  "Text Input": {
    emptyState: "default",
    filledState: "filled",
    invalidProp: "isInvalid",
    invalidTrue: "yes",
    invalidFalse: "no",
    disabledProp: "isDisabled",
    disabledTrue: "yes",
  },

  "Text Area": {
    emptyState: "default",
    filledState: "filled",
    invalidProp: "isInvalid",
    invalidTrue: "true",
    invalidFalse: "false",
    disabledProp: "isDisabled",
    disabledTrue: "true",
  },

  Datepicker: {
    emptyState: "default",
    filledState: "filled",
    invalidProp: "isInvalid",
    invalidTrue: "true",
    invalidFalse: "false",
    disabledProp: "isDisabled",
    disabledTrue: "true",
  },

  "upload-field": {
    emptyState: "default",
    filledState: "uploaded",
    invalidProp: "isInvalid",
    invalidTrue: "true",
    invalidFalse: "false",
    disabledProp: "isDisabled",
    disabledTrue: "true",
  },

  currency: {
    emptyState: "Default",
    filledState: "filled",
    invalidProp: "isInvalid",
    invalidTrue: "true",
    invalidFalse: "false",
    disabledProp: "isDisable",
    disabledTrue: "True",
  },
};

figma.ui.onmessage = (msg) => {
  if (msg.type !== "generate") return;

  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].type !== "FRAME") {
    figma.notify("Pilih 1 frame UI sebagai source");
    return;
  }

  const baseFrame = selection[0];
  const options = msg.options;

  const gap = 40;
  let index = 0;

  if (options.filled) {
    generateUIState(baseFrame, {
      name: "Filled",
      filled: true,
      isError: false,
      index: ++index,
      gap,
    });
  }

  if (options.filledError) {
    generateUIState(baseFrame, {
      name: "Filled Error",
      filled: true,
      isError: true,
      index: ++index,
      gap,
    });
  }

  if (options.emptyError) {
    generateUIState(baseFrame, {
      name: "Empty Error",
      filled: false,
      isError: true,
      index: ++index,
      gap,
    });
  }

  figma.notify("UI states generated");
};

function generateUIState(baseFrame, config) {
  const clone = baseFrame.clone();

  clone.x = baseFrame.x + config.index * (baseFrame.width + config.gap);
  clone.y = baseFrame.y;
  clone.name = `${baseFrame.name} — ${config.name}`;

  figma.currentPage.appendChild(clone);

  const forms = clone.findAll(
    (n) => n.type === "INSTANCE" && n.name === "Form"
  );

  forms.forEach((form) => {
    const inputs = form.findAll(
      (n) => n.type === "INSTANCE" && INPUT_COMPONENTS[n.name]
    );

    inputs.forEach((input) => {
      const spec = INPUT_COMPONENTS[input.name];
      const props = input.componentProperties;
      if (!props) return;

      const patch = {};

      if ("state" in props) {
        patch.state = config.filled ? spec.filledState : spec.emptyState;
      }

      if (spec.invalidProp in props) {
        patch[spec.invalidProp] = config.isError
          ? spec.invalidTrue
          : spec.invalidFalse;
      }

      try {
        input.setProperties(patch);
      } catch (_) {}
    });

    evaluateFormState(form);
  });
}

function evaluateFormState(form) {
  const inputs = form.findAll(
    (n) => n.type === "INSTANCE" && INPUT_COMPONENTS[n.name]
  );

  let hasEnabledInput = false;
  let hasInvalidInput = false;

  inputs.forEach((input) => {
    const spec = INPUT_COMPONENTS[input.name];
    const props = input.componentProperties;
    if (!props) return;

    const isDisabled =
      spec.disabledProp in props &&
      props[spec.disabledProp].value === spec.disabledTrue;

    if (isDisabled) return;

    hasEnabledInput = true;

    if (
      spec.invalidProp in props &&
      props[spec.invalidProp].value === spec.invalidTrue
    ) {
      hasInvalidInput = true;
    }
  });

  if (!form.componentProperties || !("state" in form.componentProperties)) {
    return;
  }

  if (!hasEnabledInput) {
    form.setProperties({ state: "Default" });
    return;
  }

  if (hasInvalidInput) {
    form.setProperties({ state: "invalid" });
    return;
  }

  form.setProperties({ state: "Default" });
}
